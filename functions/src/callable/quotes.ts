import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import puppeteer from "puppeteer";
import Handlebars from "handlebars";
import { getQuoteTemplate } from "../services/pdf/templates";

const db = admin.firestore();
const storage = admin.storage();

interface GeneratePDFRequest {
  orgId: string;
  quoteId: string;
}

interface QuoteData {
  id: string;
  customerId: string;
  number: string;
  [key: string]: unknown;
}

export const generateQuotePDF = functions
  .region("europe-west1")
  .runWith({
    memory: "1GB",
    timeoutSeconds: 120,
  })
  .https.onCall(async (data: GeneratePDFRequest, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to generate PDFs"
      );
    }

    const { orgId, quoteId } = data;

    if (!orgId || !quoteId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "orgId and quoteId are required"
      );
    }

    try {
      // Verify user has access to organization
      const memberDoc = await db
        .collection("organizations")
        .doc(orgId)
        .collection("members")
        .doc(context.auth.uid)
        .get();

      if (!memberDoc.exists) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Not a member of this organization"
        );
      }

      // Get quote data
      const quoteDoc = await db
        .collection("organizations")
        .doc(orgId)
        .collection("quotes")
        .doc(quoteId)
        .get();

      if (!quoteDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Quote not found");
      }

      const quote = { id: quoteDoc.id, ...quoteDoc.data() } as QuoteData;

      // Get organization data
      const orgDoc = await db.collection("organizations").doc(orgId).get();
      const organization = orgDoc.data();

      // Get customer data
      const customerDoc = await db
        .collection("organizations")
        .doc(orgId)
        .collection("customers")
        .doc(quote.customerId)
        .get();
      const customer = customerDoc.exists
        ? { id: customerDoc.id, ...customerDoc.data() }
        : null;

      // Generate HTML from template
      const template = Handlebars.compile(getQuoteTemplate());
      const html = template({
        quote,
        organization,
        customer,
        generatedAt: new Date().toLocaleDateString("pt-PT"),
      });

      // Launch puppeteer and generate PDF
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        margin: {
          top: "20mm",
          right: "15mm",
          bottom: "20mm",
          left: "15mm",
        },
        printBackground: true,
      });

      await browser.close();

      // Upload to Cloud Storage
      const bucket = storage.bucket();
      const fileName = `quotes/${orgId}/${quoteId}/quote-${quote.number}.pdf`;
      const file = bucket.file(fileName);

      await file.save(pdfBuffer, {
        metadata: {
          contentType: "application/pdf",
          metadata: {
            quoteId,
            orgId,
            quoteNumber: quote.number,
          },
        },
      });

      // Make file publicly accessible (or use signed URLs for private access)
      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      // Update quote with PDF URL
      await db
        .collection("organizations")
        .doc(orgId)
        .collection("quotes")
        .doc(quoteId)
        .update({
          pdfURL: publicUrl,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      return {
        success: true,
        pdfURL: publicUrl,
      };
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to generate PDF"
      );
    }
  });
