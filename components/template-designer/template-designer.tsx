'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Template } from '@/types';
import { Save, Eye } from 'lucide-react';

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

interface TemplateConfig {
  // Company
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyMobile: string;
  companyStateCode: string;
  gstin: string;
  upiId: string;
  jurisdiction: string;
  logoUrl: string;
  // Appearance
  accentColor: string;
  showGaneshHeader: boolean;
  showOriginalDuplicate: boolean;
  showBrokerField: boolean;
  showQualityField: boolean;
  showGstinField: boolean;
  showNoDyeingGuarantee: boolean;
  // Invoice – bank / tax defaults
  bankName: string;
  accountNo: string;
  ifscCode: string;
  defaultHsnCode: string;
  defaultDueDays: string;
  defaultCgstPercent: string;
  defaultSgstPercent: string;
  defaultIgstPercent: string;
  // Invoice – layout toggles
  showNetRate: boolean;
  showAmountInWords: boolean;
  showReceivedBox: boolean;
  // Footer
  showTermsOfSale: boolean;
  customTerms: string;
  footerNote: string;
  signatureLabel: string;
}

const DEFAULT_TERMS = [
  "Payment to be made by A/c. payee's cheque/draft only.",
  'Any complaint should be made within 2 days after that no complaint will be entertained.',
  'Interest @ 24% per annum will be charged after due date of the bill.',
  'We are not responsible for any loss or damage during transit.',
  'Goods once sold will not be taken back.',
  'Subject to SURAT Jurisdiction.',
].join('\n');

const COLOR_THEMES = [
  { label: 'Black',      value: '#111111' },
  { label: 'Navy Blue',  value: '#1e3a6e' },
  { label: 'Dark Green', value: '#1a5c38' },
  { label: 'Deep Red',   value: '#8b1a1a' },
  { label: 'Maroon',     value: '#6b1f47' },
];

// ────────────────────────────────────────────────────────────────────────────
// Helpers to convert between Template and TemplateConfig
// ────────────────────────────────────────────────────────────────────────────

function configFromTemplate(template?: Template): TemplateConfig {
  const h = (template?.headerLayout || {}) as any;
  const cs = (template?.customerSectionLayout || {}) as any;
  const f = (template?.footerLayout || {}) as any;
  return {
    companyName:           h.companyName          ?? 'K. J. TEXTILE',
    companyAddress:        h.companyAddress        ?? 'PLOT NO-33, GIDC, OLPAD, OPP. HINDUSTAN CHEMICAL COMPANY, ASNABAD GAM, OLPAD SURAT',
    companyPhone:          h.companyPhone          ?? '',
    companyMobile:         h.companyMobile         ?? '9913555599',
    companyStateCode:      h.companyStateCode      ?? '24',
    gstin:                 h.gstin                 ?? '24ANHPP2082P1ZJ',
    upiId:                 h.upiId                 ?? '',
    jurisdiction:          h.jurisdiction          ?? 'Subject To Surat Jurisdiction',
    logoUrl:               template?.logoUrl        ?? '',
    accentColor:           h.accentColor           ?? '#111111',
    showGaneshHeader:      h.showGaneshHeader       ?? true,
    showOriginalDuplicate: h.showOriginalDuplicate  ?? true,
    showBrokerField:       cs.showBrokerField       ?? true,
    showQualityField:      cs.showQualityField      ?? true,
    showGstinField:        cs.showGstinField        ?? true,
    showNoDyeingGuarantee: f.showNoDyeingGuarantee  ?? true,
    bankName:              f.bankName               ?? 'THE SURAT DIST CO-OP BANK',
    accountNo:             f.accountNo              ?? '808005230586',
    ifscCode:              f.ifscCode               ?? 'SDCB0000005',
    defaultHsnCode:        f.defaultHsnCode         ?? '5407',
    defaultDueDays:        f.defaultDueDays         ?? '30',
    defaultCgstPercent:    f.defaultCgstPercent     ?? '7',
    defaultSgstPercent:    f.defaultSgstPercent     ?? '0',
    defaultIgstPercent:    f.defaultIgstPercent     ?? '0',
    showNetRate:           f.showNetRate            ?? true,
    showAmountInWords:     f.showAmountInWords      ?? true,
    showReceivedBox:       f.showReceivedBox        ?? true,
    showTermsOfSale:       f.showTermsOfSale        ?? true,
    customTerms:           f.customTerms            ?? DEFAULT_TERMS,
    footerNote:            f.footerNote             ?? '',
    signatureLabel:        f.signatureLabel         ?? 'Proprietor/Authorized Person',
  };
}

function configToTemplate(
  existing: Template | undefined,
  name: string,
  docType: string,
  cfg: TemplateConfig
): any {
  return {
    id: existing?.id || '',
    name,
    type: docType,
    logoUrl: cfg.logoUrl || existing?.logoUrl || '',
    isDefault: existing?.isDefault || false,
    userId: existing?.userId || '',
    headerLayout: {
      companyName:           cfg.companyName,
      companyAddress:        cfg.companyAddress,
      companyPhone:          cfg.companyPhone,
      companyMobile:         cfg.companyMobile,
      companyStateCode:      cfg.companyStateCode,
      gstin:                 cfg.gstin,
      upiId:                 cfg.upiId,
      jurisdiction:          cfg.jurisdiction,
      accentColor:           cfg.accentColor,
      showGaneshHeader:      cfg.showGaneshHeader,
      showOriginalDuplicate: cfg.showOriginalDuplicate,
    },
    customerSectionLayout: {
      showBrokerField:  cfg.showBrokerField,
      showQualityField: cfg.showQualityField,
      showGstinField:   cfg.showGstinField,
    },
    tableLayout: {},
    footerLayout: {
      showNoDyeingGuarantee: cfg.showNoDyeingGuarantee,
      bankName:              cfg.bankName,
      accountNo:             cfg.accountNo,
      ifscCode:              cfg.ifscCode,
      defaultHsnCode:        cfg.defaultHsnCode,
      defaultDueDays:        cfg.defaultDueDays,
      defaultCgstPercent:    cfg.defaultCgstPercent,
      defaultSgstPercent:    cfg.defaultSgstPercent,
      defaultIgstPercent:    cfg.defaultIgstPercent,
      showNetRate:           cfg.showNetRate,
      showAmountInWords:     cfg.showAmountInWords,
      showReceivedBox:       cfg.showReceivedBox,
      showTermsOfSale:       cfg.showTermsOfSale,
      customTerms:           cfg.customTerms,
      footerNote:            cfg.footerNote,
      signatureLabel:        cfg.signatureLabel,
    },
    createdAt:  existing?.createdAt  || new Date(),
    updatedAt:  new Date(),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Live Preview component
// ────────────────────────────────────────────────────────────────────────────

function LivePreview({ cfg, docType }: { cfg: TemplateConfig; docType: string }) {
  const color = cfg.accentColor;
  const isChallan = docType === 'challan';

  return (
    <div className="border rounded-lg overflow-hidden shadow text-[9px] leading-tight bg-white select-none">
      {/* Jurisdiction + Doc type */}
      <div className="px-3 pt-2 pb-1 flex items-center justify-between" style={{ borderBottom: `2px solid ${color}` }}>
        <span className="text-gray-400">{cfg.jurisdiction}</span>
        <span className="font-bold uppercase text-[10px]" style={{ color }}>
          {isChallan ? 'Delivery Challan' : ':: SHREE GANESHAY NAMAH ::'}
        </span>
      </div>

      {/* Company header */}
      <div className="text-center py-2 px-3">
        <div className="text-[15px] font-extrabold tracking-wide" style={{ color }}>{cfg.companyName || '—'}</div>
        <div className="text-gray-500 mt-0.5 text-[8px] leading-snug">{cfg.companyAddress}</div>
        <div className="text-gray-500 text-[8px] mt-0.5">
          {cfg.companyPhone && `Phone: ${cfg.companyPhone}  `}
          {cfg.companyMobile && `Mobile: ${cfg.companyMobile}  `}
        </div>
        {!isChallan && (
          <div className="mt-1 inline-block border px-3 py-0.5 rounded text-[8px] font-semibold" style={{ borderColor: color, color }}>
            GSTIN : {cfg.gstin}
          </div>
        )}
      </div>

      {/* Separator */}
      <div style={{ borderTop: `1.5px solid ${color}` }} />

      {/* Customer + Doc info row */}
      <div className="flex gap-2 px-3 py-2">
        <div className="flex-1 border rounded p-1.5" style={{ borderColor: '#ddd' }}>
          <div className="text-gray-400 text-[7px] uppercase font-semibold mb-1">
            {isChallan ? 'Consignee' : 'Billed To'}
          </div>
          <div className="font-bold text-gray-700">M/s. [Customer Name]</div>
          <div className="text-gray-400">[Address, City]</div>
          {cfg.showGstinField && <div className="text-gray-400">GSTIN : [Customer GSTIN]</div>}
        </div>
        <div className="w-28 border rounded p-1.5" style={{ borderColor: '#ddd' }}>
          <div className="text-gray-400 text-[7px] uppercase font-semibold mb-1">
            {isChallan ? 'Challan Info' : 'Invoice Info'}
          </div>
          <div>No. : <span className="font-bold">[001]</span></div>
          <div>Date : [dd/mm/yy]</div>
          {cfg.showQualityField && isChallan && <div>Quality : [SEMI 34gm]</div>}
          {cfg.showBrokerField  && <div>Broker : [Name]</div>}
          {!isChallan && <div>Due : [dd/mm/yy]</div>}
        </div>
      </div>

      {/* Table mock */}
      <div className="mx-3 mb-2 border rounded overflow-hidden" style={{ borderColor: '#ddd' }}>
        <div className="grid text-center font-bold py-1 px-1 text-[7px]"
          style={{ gridTemplateColumns: isChallan ? 'repeat(4, 1fr)' : '1.5fr 3fr 1fr 1fr 1.5fr 1.5fr 2fr', backgroundColor: color, color: '#fff' }}>
          {isChallan
            ? ['Sr#', 'Meter', 'Sr#', 'Meter'].map((h, i) => <span key={i}>{h}</span>)
            : ['Sr', 'Description', 'HSN', 'Taka', 'Metres', 'Rate', 'Amount'].map((h, i) => <span key={i}>{h}</span>)
          }
        </div>
        {[1, 2, 3].map((r) => (
          <div key={r} className="grid text-center py-0.5 px-1 border-t text-[7px] text-gray-400"
            style={{ gridTemplateColumns: isChallan ? 'repeat(4, 1fr)' : '1.5fr 3fr 1fr 1fr 1.5fr 1.5fr 2fr', borderColor: '#eee' }}>
            {isChallan
              ? ['—', '—', '—', '—'].map((v, i) => <span key={i}>{v}</span>)
              : ['—', '—', '—', '—', '—', '—', '—'].map((v, i) => <span key={i}>{v}</span>)
            }
          </div>
        ))}
      </div>

      {/* Footer row */}
      <div className="flex gap-2 px-3 pb-2">
        {!isChallan && (
          <div className="flex-1 border rounded p-1.5" style={{ borderColor: '#ddd' }}>
            <div className="text-gray-400 text-[7px] uppercase font-semibold mb-1">Bank Details</div>
            <div>{cfg.bankName || '—'}</div>
            <div>A/c: {cfg.accountNo || '—'}</div>
            <div>IFSC: {cfg.ifscCode || '—'}</div>
          </div>
        )}
        <div className="flex-1 border rounded p-1.5" style={{ borderColor: '#ddd' }}>
          <div className="font-bold text-gray-700">FOR {cfg.companyName || '—'}</div>
          {cfg.showNoDyeingGuarantee && (
            <div className="text-gray-400 mt-1">NO DYEING GUARANTEE</div>
          )}
          <div className="text-gray-400 mt-2">{cfg.signatureLabel}</div>
        </div>
      </div>

      {cfg.showTermsOfSale && (
        <div className="px-3 pb-2 text-[7px] text-gray-400 border-t" style={{ borderColor: '#eee' }}>
          <span className="font-semibold text-gray-600">Terms: </span>
          {cfg.customTerms.split('\n').slice(0, 2).join(' | ')}…
        </div>
      )}
      {cfg.footerNote && (
        <div className="px-3 pb-2 text-[7px] text-gray-500 italic">{cfg.footerNote}</div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Form section wrapper
// ────────────────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
      {children}
      <Separator />
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium">{label}</Label>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {children}
    </div>
  );
}

function ToggleField({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────────────

export function TemplateDesigner({ template, onSave }: { template?: Template; onSave: (template: Template) => void }) {
  const [name, setName] = useState((template as any)?.name || '');
  const [docType, setDocType] = useState<string>((template as any)?.type || 'challan');
  const [cfg, setCfg] = useState<TemplateConfig>(() => configFromTemplate(template));
  const [showPreview, setShowPreview] = useState(true);

  const set = (key: keyof TemplateConfig, value: any) =>
    setCfg((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!name.trim()) { alert('Please enter a template name.'); return; }
    onSave(configToTemplate(template, name, docType, cfg) as Template);
  };

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-48">
          <Field label="Template Name" hint="Give this template a recognisable name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. KJ Textile Challan 2026"
            />
          </Field>
        </div>
        <div className="w-44">
          <Field label="Document Type">
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="challan">Delivery Challan</SelectItem>
                <SelectItem value="invoice">Tax Invoice</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowPreview((p) => !p)}>
          <Eye className="w-4 h-4 mr-1" />
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </Button>
      </div>

      <div className={`grid gap-8 ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-2xl'}`}>

        {/* ── Left: Form ──────────────────────────────────────────────── */}
        <div className="space-y-6">

          <Section title="Company Details">
            <Field label="Company Name" hint="Appears as the large heading on the document">
              <Input value={cfg.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="K. J. TEXTILE" />
            </Field>
            <Field label="Company Address">
              <Input value={cfg.companyAddress} onChange={(e) => set('companyAddress', e.target.value)} placeholder="Full address, City" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Office Phone">
                <Input value={cfg.companyPhone} onChange={(e) => set('companyPhone', e.target.value)} placeholder="0261-XXXXXXX" />
              </Field>
              <Field label="Mobile">
                <Input value={cfg.companyMobile} onChange={(e) => set('companyMobile', e.target.value)} placeholder="9913555599" />
              </Field>
            </div>
            <Field label="GSTIN">
              <Input value={cfg.gstin} onChange={(e) => set('gstin', e.target.value)} placeholder="24ANHPP2082P1ZJ" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="State Code" hint="Your company's GST state code">
                <Input value={cfg.companyStateCode} onChange={(e) => set('companyStateCode', e.target.value)} placeholder="24" />
              </Field>
              <Field label="UPI ID" hint="Printed in bank details on invoices">
                <Input value={cfg.upiId} onChange={(e) => set('upiId', e.target.value)} placeholder="yourname@upi" />
              </Field>
            </div>
            <Field label="Jurisdiction Line" hint="Small text shown at the top of the document">
              <Input value={cfg.jurisdiction} onChange={(e) => set('jurisdiction', e.target.value)} placeholder="Subject To Surat Jurisdiction" />
            </Field>
            <Field label="Company Logo URL" hint="Optional — paste a direct image URL (https://...). The logo appears at the top-left of all PDFs using this template.">
              <Input value={cfg.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} placeholder="https://example.com/logo.png" />
            </Field>
          </Section>

          <Section title="Appearance">
            <Field label="Accent Color" hint="Used for headings and table headers">
              <div className="flex flex-wrap gap-2 mt-1">
                {COLOR_THEMES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    title={t.label}
                    onClick={() => set('accentColor', t.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      cfg.accentColor === t.value ? 'border-gray-900 scale-110 shadow' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: t.value }}
                  />
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cfg.accentColor}
                    onChange={(e) => set('accentColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border"
                    title="Custom color"
                  />
                  <span className="text-xs text-gray-400">Custom</span>
                </div>
              </div>
            </Field>

            <ToggleField
              label="Show 'SHREE GANESHAY NAMAH' Header"
              hint="Print the auspicious header at the top of the document"
              value={cfg.showGaneshHeader}
              onChange={(v) => set('showGaneshHeader', v)}
            />
            <ToggleField
              label="Show 'Original / Duplicate' Copy Text"
              hint="Print 'Original - For Buyer' and 'Duplicate - For Assessee' on invoices"
              value={cfg.showOriginalDuplicate}
              onChange={(v) => set('showOriginalDuplicate', v)}
            />
            <ToggleField
              label="Show Broker Field"
              hint="Display the broker name on the document"
              value={cfg.showBrokerField}
              onChange={(v) => set('showBrokerField', v)}
            />
            {docType === 'challan' && (
              <ToggleField
                label="Show Quality Field"
                hint="Display the fabric quality on the challan"
                value={cfg.showQualityField}
                onChange={(v) => set('showQualityField', v)}
              />
            )}
            <ToggleField
              label="Show Customer GSTIN"
              hint="Display the customer's GSTIN number"
              value={cfg.showGstinField}
              onChange={(v) => set('showGstinField', v)}
            />
            <ToggleField
              label="Show 'NO DYEING GUARANTEE'"
              hint="Print this notice at the bottom of the document"
              value={cfg.showNoDyeingGuarantee}
              onChange={(v) => set('showNoDyeingGuarantee', v)}
            />
          </Section>

          {docType === 'invoice' && (
            <Section title="Invoice Defaults">
              <p className="text-xs text-gray-400 -mt-2">These values pre-fill new invoices and set defaults in the PDF.</p>
              <div className="grid grid-cols-3 gap-3">
                <Field label="CGST %" hint="e.g. 7">
                  <Input value={cfg.defaultCgstPercent} onChange={(e) => set('defaultCgstPercent', e.target.value)} placeholder="7" />
                </Field>
                <Field label="SGST %" hint="e.g. 0">
                  <Input value={cfg.defaultSgstPercent} onChange={(e) => set('defaultSgstPercent', e.target.value)} placeholder="0" />
                </Field>
                <Field label="IGST %" hint="e.g. 0">
                  <Input value={cfg.defaultIgstPercent} onChange={(e) => set('defaultIgstPercent', e.target.value)} placeholder="0" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Default HSN Code" hint="Used when no HSN is specified on an item">
                  <Input value={cfg.defaultHsnCode} onChange={(e) => set('defaultHsnCode', e.target.value)} placeholder="5407" />
                </Field>
                <Field label="Payment Due Days" hint="Days after invoice date when payment is due">
                  <Input value={cfg.defaultDueDays} onChange={(e) => set('defaultDueDays', e.target.value)} placeholder="30" type="number" min="0" />
                </Field>
              </div>
            </Section>
          )}

          {docType === 'invoice' && (
            <Section title="Bank Details  (printed on invoice)">
              <Field label="Bank Name">
                <Input value={cfg.bankName} onChange={(e) => set('bankName', e.target.value)} placeholder="THE SURAT DIST CO-OP BANK" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Account Number">
                  <Input value={cfg.accountNo} onChange={(e) => set('accountNo', e.target.value)} placeholder="808005230586" />
                </Field>
                <Field label="IFSC Code">
                  <Input value={cfg.ifscCode} onChange={(e) => set('ifscCode', e.target.value)} placeholder="SDCB0000005" />
                </Field>
              </div>
            </Section>
          )}

          <Section title="Footer">
            <ToggleField
              label="Show Terms of Sale"
              hint="Print numbered terms at the bottom of the document"
              value={cfg.showTermsOfSale}
              onChange={(v) => set('showTermsOfSale', v)}
            />
            {cfg.showTermsOfSale && (
              <Field label="Terms of Sale" hint="Each line is printed as a separate numbered point">
                <Textarea
                  rows={6}
                  value={cfg.customTerms}
                  onChange={(e) => set('customTerms', e.target.value)}
                  className="text-xs font-mono"
                />
              </Field>
            )}
            {docType === 'invoice' && (
              <>
                <ToggleField
                  label="Show Net Rate"
                  hint="Print the per-metre net rate below the grand total"
                  value={cfg.showNetRate}
                  onChange={(v) => set('showNetRate', v)}
                />
                <ToggleField
                  label="Show Amount in Words"
                  hint="Print the grand total in words (e.g. Seventy Six Thousand…)"
                  value={cfg.showAmountInWords}
                  onChange={(v) => set('showAmountInWords', v)}
                />
                <ToggleField
                  label="Show Received / Paid Details Box"
                  hint="Print the bill no. / cheque details box at the bottom"
                  value={cfg.showReceivedBox}
                  onChange={(v) => set('showReceivedBox', v)}
                />
              </>
            )}
            <Field label="Extra Footer Note" hint="Optional — any extra note printed at the very bottom">
              <Input value={cfg.footerNote} onChange={(e) => set('footerNote', e.target.value)} placeholder="e.g. Thank you for your business!" />
            </Field>
            <Field label="Signature Label" hint="Text printed below the signature box">
              <Input value={cfg.signatureLabel} onChange={(e) => set('signatureLabel', e.target.value)} placeholder="Proprietor/Authorized Person" />
            </Field>
          </Section>

          <Button onClick={handleSave} className="w-full" size="lg">
            <Save className="w-4 h-4 mr-2" />
            Save Template
          </Button>
        </div>

        {/* ── Right: Live Preview ─────────────────────────────────────── */}
        {showPreview && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-700">Live Preview</h3>
              <span className="text-xs text-gray-400">(updates as you type)</span>
            </div>
            <div className="sticky top-4">
              <LivePreview cfg={cfg} docType={docType} />
              <p className="text-xs text-gray-400 mt-2 text-center">
                This is a layout preview. The actual PDF will look like the built-in template with your custom details applied.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'line' | 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  borderColor?: string;
  backgroundColor?: string;
  borderWidth?: number;
}
