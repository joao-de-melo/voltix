export function getQuoteTemplate(): string {
  return `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quote {{quote.number}}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #1a1a1a;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #1e40af;
    }

    .company-info h1 {
      font-size: 24px;
      color: #1e40af;
      margin-bottom: 8px;
    }

    .company-info p {
      color: #666;
      font-size: 11px;
    }

    .quote-info {
      text-align: right;
    }

    .quote-info h2 {
      font-size: 18px;
      color: #1e40af;
      margin-bottom: 8px;
    }

    .quote-info p {
      color: #666;
      font-size: 11px;
    }

    /* Customer Section */
    .customer-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }

    .customer-details, .quote-details {
      width: 48%;
    }

    .section-title {
      font-size: 11px;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }

    .customer-name {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    /* Items Table */
    .items-section {
      margin-bottom: 30px;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    .items-table th {
      background-color: #f8f9fa;
      padding: 10px 8px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      color: #666;
      border-bottom: 1px solid #e9ecef;
    }

    .items-table th.right {
      text-align: right;
    }

    .items-table td {
      padding: 10px 8px;
      border-bottom: 1px solid #e9ecef;
      vertical-align: top;
    }

    .items-table td.right {
      text-align: right;
    }

    .item-name {
      font-weight: 500;
    }

    .item-description {
      font-size: 10px;
      color: #666;
      margin-top: 2px;
    }

    .section-header {
      background-color: #f1f5f9;
      padding: 8px;
      font-weight: bold;
      color: #334155;
    }

    /* Summary */
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }

    .summary-table {
      width: 300px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;
    }

    .summary-row.total {
      border-top: 2px solid #1e40af;
      border-bottom: none;
      margin-top: 8px;
      padding-top: 12px;
      font-size: 16px;
      font-weight: bold;
      color: #1e40af;
    }

    .summary-label {
      color: #666;
    }

    .summary-value {
      font-weight: 500;
    }

    /* System Summary */
    .system-summary {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }

    .system-summary h3 {
      font-size: 14px;
      margin-bottom: 15px;
      color: #1e40af;
    }

    .system-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }

    .system-item {
      text-align: center;
    }

    .system-item .value {
      font-size: 18px;
      font-weight: bold;
      color: #1e40af;
    }

    .system-item .label {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
    }

    /* Notes */
    .notes-section {
      margin-bottom: 30px;
    }

    .notes-section h3 {
      font-size: 12px;
      margin-bottom: 8px;
      color: #334155;
    }

    .notes-section p {
      color: #666;
      white-space: pre-wrap;
    }

    /* Footer */
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
      text-align: center;
      color: #666;
      font-size: 10px;
    }

    .validity {
      background-color: #fef3c7;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 20px;
      text-align: center;
      color: #92400e;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <h1>{{organization.name}}</h1>
        {{#if organization.settings.taxId}}
        <p>NIF: {{organization.settings.taxId}}</p>
        {{/if}}
        {{#if organization.settings.address}}
        <p>{{organization.settings.address.street}}</p>
        <p>{{organization.settings.address.postalCode}} {{organization.settings.address.city}}</p>
        {{/if}}
        {{#if organization.settings.contactPhone}}
        <p>Tel: {{organization.settings.contactPhone}}</p>
        {{/if}}
        {{#if organization.settings.contactEmail}}
        <p>Email: {{organization.settings.contactEmail}}</p>
        {{/if}}
      </div>
      <div class="quote-info">
        <h2>ORÇAMENTO</h2>
        <p><strong>Nº:</strong> {{quote.number}}</p>
        <p><strong>Data:</strong> {{generatedAt}}</p>
      </div>
    </div>

    <!-- Customer & Quote Details -->
    <div class="customer-section">
      <div class="customer-details">
        <div class="section-title">Cliente</div>
        <div class="customer-name">{{customer.name}}</div>
        {{#if customer.taxId}}
        <p>NIF: {{customer.taxId}}</p>
        {{/if}}
        {{#if customer.email}}
        <p>{{customer.email}}</p>
        {{/if}}
        {{#if customer.phone}}
        <p>{{customer.phone}}</p>
        {{/if}}
        {{#if customer.billingAddress}}
        <p>{{customer.billingAddress.street}}</p>
        <p>{{customer.billingAddress.postalCode}} {{customer.billingAddress.city}}</p>
        {{/if}}
      </div>
      <div class="quote-details">
        <div class="section-title">Validade</div>
        <p>Este orçamento é válido por {{organization.settings.quoteValidityDays}} dias</p>
      </div>
    </div>

    <!-- System Summary -->
    {{#if quote.systemSummary}}
    <div class="system-summary">
      <h3>Resumo do Sistema</h3>
      <div class="system-grid">
        {{#if quote.systemSummary.totalPanels}}
        <div class="system-item">
          <div class="value">{{quote.systemSummary.totalPanels}}</div>
          <div class="label">Painéis</div>
        </div>
        {{/if}}
        {{#if quote.systemSummary.totalKwp}}
        <div class="system-item">
          <div class="value">{{formatNumber quote.systemSummary.totalKwp}} kWp</div>
          <div class="label">Potência</div>
        </div>
        {{/if}}
        {{#if quote.systemSummary.inverterCapacityKw}}
        <div class="system-item">
          <div class="value">{{formatNumber quote.systemSummary.inverterCapacityKw}} kW</div>
          <div class="label">Inversor</div>
        </div>
        {{/if}}
        {{#if quote.systemSummary.batteryCapacityKwh}}
        <div class="system-item">
          <div class="value">{{formatNumber quote.systemSummary.batteryCapacityKwh}} kWh</div>
          <div class="label">Bateria</div>
        </div>
        {{/if}}
      </div>
    </div>
    {{/if}}

    <!-- Items -->
    <div class="items-section">
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 40%">Descrição</th>
            <th class="right" style="width: 10%">Qtd</th>
            <th class="right" style="width: 15%">Preço Unit.</th>
            <th class="right" style="width: 10%">IVA</th>
            <th class="right" style="width: 15%">Total</th>
          </tr>
        </thead>
        <tbody>
          {{#each quote.sections}}
          <tr>
            <td colspan="5" class="section-header">{{this.name}}</td>
          </tr>
          {{#each this.items}}
          <tr>
            <td>
              <div class="item-name">{{this.name}}</div>
              {{#if this.description}}
              <div class="item-description">{{this.description}}</div>
              {{/if}}
            </td>
            <td class="right">{{this.quantity}} {{this.unit}}</td>
            <td class="right">{{formatCurrency this.unitPrice}}</td>
            <td class="right">{{this.taxRate}}%</td>
            <td class="right">{{formatCurrency this.total}}</td>
          </tr>
          {{/each}}
          {{/each}}
        </tbody>
      </table>
    </div>

    <!-- Summary -->
    <div class="summary-section">
      <div class="summary-table">
        <div class="summary-row">
          <span class="summary-label">Subtotal</span>
          <span class="summary-value">{{formatCurrency quote.subtotal}}</span>
        </div>
        {{#if quote.totalDiscount}}
        <div class="summary-row">
          <span class="summary-label">Desconto</span>
          <span class="summary-value">-{{formatCurrency quote.totalDiscount}}</span>
        </div>
        {{/if}}
        <div class="summary-row">
          <span class="summary-label">IVA</span>
          <span class="summary-value">{{formatCurrency quote.taxAmount}}</span>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <span>{{formatCurrency quote.total}}</span>
        </div>
      </div>
    </div>

    <!-- Notes -->
    {{#if quote.notes}}
    <div class="notes-section">
      <h3>Notas</h3>
      <p>{{quote.notes}}</p>
    </div>
    {{/if}}

    <!-- Terms -->
    {{#if organization.branding.termsAndConditions}}
    <div class="notes-section">
      <h3>Termos e Condições</h3>
      <p>{{organization.branding.termsAndConditions}}</p>
    </div>
    {{/if}}

    <!-- Footer -->
    <div class="footer">
      <p>{{organization.name}} {{#if organization.settings.taxId}}• NIF: {{organization.settings.taxId}}{{/if}}</p>
      <p>Documento gerado em {{generatedAt}}</p>
    </div>
  </div>
</body>
</html>
`;
}

// Register Handlebars helpers
import Handlebars from "handlebars";

Handlebars.registerHelper("formatCurrency", function (value: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);
});

Handlebars.registerHelper("formatNumber", function (value: number) {
  return new Intl.NumberFormat("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
});
