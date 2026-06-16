import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Car,
  CheckCircle2,
  Clipboard,
  Download,
  FileText,
  Globe,
  Home,
  Mail,
  Monitor,
  RefreshCw,
  Bike,
  Building2,
  Building,
  History,
  Scissors,
  Smartphone,
  Truck,
  Upload,
  Volume2,
  Wand2,
  type LucideIcon,
} from 'lucide-react';
import './index.css';
import { CARRIERS, type CarrierId } from './config/carriers';
import { autoSample, dwellingSample, homeSample, motorcycleSample, rentersSample } from './data/samples';
import { autoAudioReviewScript, renderAutoWebPageHtml } from './lib/autoWebPageHtml';
import { renderCommercialAutoWebPageHtml } from './lib/commercialAutoWebPageHtml';
import { homeAudioReviewScript, renderHomeWebPageHtml } from './lib/homeWebPageHtml';
import { type EmailMode, renderQuoteHtml } from './lib/htmlSerialize';
import { runIntegrityChecks } from './lib/integrityCheck';
import { buildPdfVerificationEmail } from './lib/pdfVerificationEmail';
import { generatePlainText } from './lib/plainTextCompanion';
import { validateQuoteData } from './lib/validation';
import type { GeneratedAudioReview } from './lib/webAudioReview';
import { parseInsuranceQuote } from './services/geminiService';
import type { AutoQuoteData } from './types/auto';
import type { DwellingQuoteData } from './types/dwelling';
import type { HomeQuoteData } from './types/home';
import type { MotorcycleQuoteData } from './types/motorcycle';
import type { QuoteData, QuoteTemplateType } from './types/quote';
import type { RentersQuoteData } from './types/renters';

const carrierOptions = Object.values(CARRIERS);
const recentStorageKey = 'quote-template-studio-recent-quotes';
type OutputMode = 'email' | 'webpage' | 'commercialWebpage';

const QUOTE_TYPE_OPTIONS: Array<{ id: QuoteTemplateType; label: string; hint: string; Icon: LucideIcon }> = [
  { id: 'auto', label: 'Auto', hint: 'Personal vehicles & drivers', Icon: Car },
  { id: 'home', label: 'Home', hint: 'Homeowners HO-3', Icon: Home },
  { id: 'motorcycle', label: 'Motorcycle', hint: 'Bikes & rated riders', Icon: Bike },
  { id: 'renters', label: 'Renters', hint: 'HO-4 tenant policy', Icon: Building2 },
  { id: 'dwelling', label: 'Rental Home', hint: 'DP-1/2/3 landlord', Icon: Building },
];

function emailModeOptions(type: QuoteTemplateType): Array<{ id: EmailMode; label: string }> {
  const base: Array<{ id: EmailMode; label: string }> = [
    { id: 'full', label: 'Full Explanation' },
    { id: 'short', label: 'Short Close' },
  ];
  if (type === 'auto') {
    return [...base, { id: 'autoElite', label: 'Auto Elite Welcome' }, { id: 'autoEliteQuote', label: 'Auto Elite Quote' }, { id: 'commercialAutoElite', label: 'Commercial Auto Elite' }];
  }
  if (type === 'home') {
    return [...base, { id: 'homeElite', label: 'Home Elite Welcome' }, { id: 'homeEliteQuote', label: 'Home Elite Quote' }];
  }
  return base;
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

function numberValue(value: string) {
  const cleaned = value.replace(/[$,]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function optionalNumberValue(value: string) {
  const cleaned = value.replace(/[$,]/g, '').trim();
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

interface ReviewItem {
  key: string;
  label: string;
  value: string;
  required: boolean;
}

interface RecentQuote {
  id: string;
  client: string;
  templateType: QuoteTemplateType;
  carrier: string;
  action: string;
  savedAt: string;
}

type WebAudioReviewState = GeneratedAudioReview & {
  templateType: 'auto' | 'home';
  quoteNumber: string;
  clientFullName: string;
  generatedAt: string;
};

const moneyValue = (value: number, digits = 2) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

function templateData(type: QuoteTemplateType): QuoteData {
  return type === 'auto' ? clone(autoSample) : type === 'home' ? clone(homeSample) : type === 'motorcycle' ? clone(motorcycleSample) : type === 'renters' ? clone(rentersSample) : clone(dwellingSample);
}

function suggestTemplateType(text: string): QuoteTemplateType | null {
  const source = text.toLowerCase();
  if (/\b(renters|tenant|ho-4|ho4|apartment|lease)\b/.test(source)) return 'renters';
  if (/\b(dp-1|dp1|dp-2|dp2|dp-3|dp3|dwelling fire|landlord|rental property|fair rental|steadily|fortegra)\b/.test(source)) return 'dwelling';
  if (/\b(motorcycle|bike|harley|dairyland|class m|road glide|ninja|yamaha|honda cbr)\b/.test(source)) return 'motorcycle';
  if (/\b(homeowners|homeowner|ho-3|ho3|dwelling|coverage a|roof|wind\/hail|wind hail)\b/.test(source)) return 'home';
  if (/\b(auto|vehicle|driver|vin|collision|comprehensive|progressive auto)\b/.test(source)) return 'auto';
  return null;
}

function reviewItemsForQuote(data: QuoteData): ReviewItem[] {
  const carrier = CARRIERS[data.carrierId]?.displayName || data.carrierId;
  const common: ReviewItem[] = [
    { key: 'client', label: 'Client name', value: data.clientFullName || 'Needs review', required: true },
    { key: 'email', label: 'Client email', value: data.clientEmail || 'Optional - Gmail opens without a recipient', required: false },
    { key: 'carrier', label: 'Carrier', value: carrier || 'Needs review', required: true },
    { key: 'effective', label: 'Effective date', value: data.effectiveDate || 'Needs review', required: true },
    { key: 'expires', label: 'Quote expiration', value: data.expiryDate || 'Needs review', required: true },
  ];

  if (data.templateType === 'auto') {
    return [
      ...common,
      { key: 'premium', label: 'Total premium', value: moneyValue(data.totalPremium), required: true },
      { key: 'payment', label: 'EFT payment', value: `${moneyValue(data.paymentOptions.eft.downPayment)} down, then ${moneyValue(data.paymentOptions.eft.recurringAmount)}`, required: true },
      { key: 'vehicles', label: 'Vehicle count/details', value: `${data.vehicles.length} vehicles`, required: true },
      { key: 'drivers', label: 'Driver count/details', value: `${data.drivers.length} drivers`, required: true },
      { key: 'vehicleCoverage', label: 'Per-vehicle coverage', value: data.vehicles.every((vehicle) => vehicle.coverages?.length) ? 'Itemized' : 'Needs review', required: true },
    ];
  }
  if (data.templateType === 'home') {
    const tiv = data.coverages.coverageA + data.coverages.coverageB + data.coverages.coverageC;
    return [
      ...common,
      { key: 'premium', label: 'Annual premium', value: moneyValue(data.annualPremium), required: true },
      { key: 'property', label: 'Property address', value: data.propertyAddress || 'Needs review', required: true },
      { key: 'coverageA', label: 'Coverage A', value: moneyValue(data.coverages.coverageA), required: true },
      { key: 'tiv', label: 'Combined property value', value: `${moneyValue(tiv)} A+B+C`, required: true },
      { key: 'deductible', label: 'Deductible', value: moneyValue(data.allPerilDeductible), required: true },
    ];
  }
  if (data.templateType === 'motorcycle') {
    return [
      ...common,
      { key: 'premium', label: 'Annual premium', value: moneyValue(data.annualPremium), required: true },
      { key: 'bike', label: 'Motorcycle', value: [data.bike.year, data.bike.make, data.bike.model].filter(Boolean).join(' ') || 'Needs review', required: true },
      { key: 'vin', label: 'VIN', value: data.bike.vin || 'Needs review', required: true },
      { key: 'cpe', label: 'CPE limit', value: data.coverages.find((coverage) => /custom parts|cpe/i.test(coverage.name))?.limit || 'Needs review', required: true },
      { key: 'riders', label: 'Rated riders', value: `${data.riders.length} riders`, required: true },
      { key: 'legal', label: 'Carrier legal entity', value: data.carrierLegalEntity || 'Needs review', required: true },
    ];
  }
  if (data.templateType === 'dwelling') {
    const annualRent = data.rental.monthlyRent * 12;
    return [
      ...common,
      { key: 'premium', label: 'Annual premium', value: moneyValue(data.annualPremium), required: true },
      { key: 'form', label: 'DP form', value: data.formCode || 'Needs review', required: true },
      { key: 'property', label: 'Rental address', value: `${data.property.streetAddress}, ${data.property.city}, ${data.property.state} ${data.property.zip}`, required: true },
      { key: 'coverageA', label: 'Coverage A', value: moneyValue(data.coverages.coverageA), required: true },
      { key: 'coverageD', label: 'Fair Rental Value', value: `${moneyValue(data.coverages.coverageD)} (${data.coverages.coverageD >= annualRent ? 'adequate' : 'review rent gap'})`, required: true },
      { key: 'windhail', label: 'Wind/Hail deductible', value: data.coverages.windHailDeductible || 'Needs review', required: true },
      { key: 'use', label: 'Use/vacancy status', value: `${data.rental.useType} - ${data.rental.currentStatus}`, required: true },
      { key: 'legal', label: 'Carrier legal entity', value: data.carrierLegalEntity || 'Needs review', required: true },
      { key: 'surplus', label: 'Surplus lines status', value: data.isSurplusLines ? 'Surplus notice required' : 'Admitted/non-surplus', required: true },
    ];
  }
  return [
    ...common,
    { key: 'premium', label: 'Annual premium', value: moneyValue(data.annualPremium), required: true },
    { key: 'unit', label: 'Unit address', value: `${data.unit.streetAddress}, ${data.unit.city}, ${data.unit.state} ${data.unit.zip}`, required: true },
    { key: 'coverageC', label: 'Coverage C', value: `${moneyValue(data.coverages.coverageC)} ${data.coverages.coverageCSettlement}`, required: true },
    { key: 'liability', label: 'Liability', value: moneyValue(data.coverages.coverageE), required: true },
    { key: 'deductible', label: 'Deductible', value: moneyValue(data.coverages.deductible), required: true },
    { key: 'legal', label: 'Carrier legal entity', value: data.carrierLegalEntity || 'Needs review', required: true },
  ];
}

function readinessItems(data: QuoteData, integrityPassed: boolean, dataErrors: string[], reviewComplete: boolean, byteCount: number) {
  return [
    { label: 'Required fields valid', ok: dataErrors.length === 0, detail: dataErrors.length ? `${dataErrors.length} issue(s)` : 'No missing required fields' },
    { label: 'Staff review status', ok: reviewComplete, detail: reviewComplete ? 'Staff review complete' : 'Export allowed - review checklist still recommended' },
    { label: 'Gmail technical checks pass', ok: integrityPassed, detail: `${byteCount.toLocaleString()} bytes` },
    { label: 'Client email optional', ok: true, detail: data.clientEmail || 'Gmail draft opens without a recipient' },
    { label: 'Carrier legal/entity reviewed', ok: data.templateType === 'auto' || data.templateType === 'home' || Boolean(data.carrierLegalEntity), detail: data.templateType === 'auto' || data.templateType === 'home' ? 'Registry-backed' : data.carrierLegalEntity || 'Needs review' },
  ];
}

function readRecentQuotes(): RecentQuote[] {
  try {
    const raw = localStorage.getItem(recentStorageKey);
    return raw ? JSON.parse(raw) as RecentQuote[] : [];
  } catch {
    return [];
  }
}

function App() {
  const [quoteType, setQuoteType] = useState<QuoteTemplateType>('auto');
  const [file, setFile] = useState<File | null>(null);
  const [instructions, setInstructions] = useState('');
  const [emailMode, setEmailMode] = useState<EmailMode>('full');
  const [outputMode, setOutputMode] = useState<OutputMode>('email');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [data, setData] = useState<QuoteData>(() => clone(autoSample));
  const [reviewedKeys, setReviewedKeys] = useState<string[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<RecentQuote[]>([]);
  const [audioReview, setAudioReview] = useState<WebAudioReviewState | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const rendered = useMemo(() => renderQuoteHtml(data, emailMode), [data, emailMode]);
  const webAudioScript = useMemo(() => {
    if (data.templateType === 'auto') return autoAudioReviewScript(data);
    if (data.templateType === 'home') return homeAudioReviewScript(data);
    return '';
  }, [data]);
  const activeAudioReview = useMemo<GeneratedAudioReview | null>(() => {
    if (!audioReview) return null;
    if (data.templateType !== audioReview.templateType) return null;
    if (data.quoteNumber !== audioReview.quoteNumber) return null;
    if (data.clientFullName !== audioReview.clientFullName) return null;
    return audioReview;
  }, [audioReview, data.clientFullName, data.quoteNumber, data.templateType]);
  const renderedWebPage = useMemo(() => {
    if (outputMode === 'commercialWebpage' && data.templateType === 'auto') return renderCommercialAutoWebPageHtml(data);
    if (data.templateType === 'auto') return renderAutoWebPageHtml(data, activeAudioReview);
    if (data.templateType === 'home') return renderHomeWebPageHtml(data, activeAudioReview);
    return null;
  }, [activeAudioReview, data, outputMode]);
  const isWebOutput = outputMode === 'webpage' || outputMode === 'commercialWebpage';
  const previewHtml = isWebOutput && renderedWebPage ? renderedWebPage.html : rendered.html;
  const previewTitle = isWebOutput && renderedWebPage ? renderedWebPage.title : rendered.subject;
  const previewSubhead = isWebOutput
    ? outputMode === 'commercialWebpage'
      ? 'Responsive commercial auto quote webpage preview'
      : `Responsive ${data.templateType} quote webpage preview`
    : rendered.preheader;
  const previewByteCount = new Blob([previewHtml]).size;
  const integrity = useMemo(() => runIntegrityChecks(rendered.html), [rendered.html]);
  const dataErrors = useMemo(() => validateQuoteData(data), [data]);
  const textCompanion = useMemo(() => generatePlainText(data), [data]);
  const reviewItems = useMemo(() => reviewItemsForQuote(data), [data]);
  const reviewedKeySet = useMemo(() => new Set(reviewedKeys), [reviewedKeys]);
  const reviewComplete = reviewItems.every((item) => !item.required || reviewedKeySet.has(item.key));
  const readiness = useMemo(() => readinessItems(data, integrity.passed, dataErrors, reviewComplete, integrity.byteCount), [data, dataErrors, integrity.byteCount, integrity.passed, reviewComplete]);
  const canExport = integrity.passed && dataErrors.length === 0;
  const canUseWebAudio = outputMode === 'webpage' && Boolean(renderedWebPage) && ['auto', 'home'].includes(data.templateType) && dataErrors.length === 0;
  const templateSuggestion = useMemo(() => suggestTemplateType(`${file?.name || ''} ${instructions}`), [file, instructions]);

  useEffect(() => {
    setRecentQuotes(readRecentQuotes());
  }, []);

  useEffect(() => {
    setReviewedKeys([]);
  }, [data.templateType, data.quoteNumber, data.clientFullName]);

  useEffect(() => {
    setAudioReview(null);
  }, [data]);

  useEffect(() => {
    if (!['auto', 'home'].includes(data.templateType) && outputMode === 'webpage') {
      setOutputMode('email');
    }
    if (data.templateType !== 'auto' && outputMode === 'commercialWebpage') {
      setOutputMode('email');
    }
    if (data.templateType !== 'home' && (emailMode === 'homeElite' || emailMode === 'homeEliteQuote')) {
      setEmailMode('full');
    }
    if (data.templateType !== 'auto' && (emailMode === 'autoElite' || emailMode === 'autoEliteQuote' || emailMode === 'commercialAutoElite')) {
      setEmailMode('full');
    }
  }, [data.templateType, emailMode, outputMode]);

  const update = (patch: Partial<QuoteData>) => {
    setData((current) => ({ ...current, ...patch }) as QuoteData);
  };

  const loadSample = (type: QuoteTemplateType) => {
    setQuoteType(type);
    setData(templateData(type));
    setFile(null);
    setMessage(`Loaded ${type} sample data.`);
  };

  const startNewQuote = () => {
    setData(templateData(quoteType));
    setFile(null);
    setInstructions('');
    setReviewedKeys([]);
    setMessage('Ready for a new quote.');
  };

  const handleFileSelected = (selectedFile: File | null) => {
    setFile(selectedFile);
    if (!selectedFile) return;
    const suggested = suggestTemplateType(`${selectedFile.name} ${instructions}`);
    if (suggested && suggested !== quoteType) {
      setMessage(`This file looks like a ${suggested} quote. Use the suggestion button before parsing if that is correct.`);
    }
  };

  const applyTemplateSuggestion = () => {
    if (!templateSuggestion) return;
    setQuoteType(templateSuggestion);
    setData(templateData(templateSuggestion));
    setReviewedKeys([]);
    setMessage(`Switched to ${templateSuggestion}. Ready to parse.`);
  };

  const handleParse = async () => {
    if (!file) {
      setMessage('Choose a carrier PDF first.');
      return;
    }
    setIsProcessing(true);
    setMessage(null);
    try {
      const parsed = await parseInsuranceQuote(file, instructions, quoteType);
      setData(parsed);
      setReviewedKeys([]);
      setMessage('PDF parsed. Review every field before exporting.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not parse the PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const fallbackCopyText = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (!copied) throw new Error('Clipboard copy was blocked by the browser.');
  };

  const copyPlainText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      fallbackCopyText(text);
    }
  };

  const copyRichHtml = async (html = rendered.html, plainText = textCompanion) => {
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plainText], { type: 'text/plain' }),
          }),
        ]);
        return;
      }
    } catch {
      fallbackCopyText(html);
      return;
    }

    await copyPlainText(html);
  };

  const copyHtml = async () => {
    await copyRichHtml();
    recordRecentQuote('Copied HTML');
    setMessage('Styled HTML copied. Paste into Gmail compose to keep the formatted email.');
  };

  const copyWebPageHtml = async () => {
    if (!renderedWebPage) return;
    await copyPlainText(renderedWebPage.html);
    recordRecentQuote('Copied Web Page HTML');
    setMessage('Webpage HTML copied. Paste into a hosted page or download it from the Web Page output.');
  };

  const copyText = async () => {
    await copyPlainText(textCompanion);
    setMessage('Plain-text companion copied.');
  };

  const copyAudioScript = async () => {
    if (!webAudioScript) {
      setMessage('Audio scripts are available for Auto Web Page and Home Web Page quotes.');
      return;
    }
    await copyPlainText(webAudioScript);
    setMessage('Audio review script copied. Create your MP3, then use Add MP3 / Audio to embed it in the webpage.');
  };

  const addAudioFile = async (selectedFile: File | null) => {
    if (!selectedFile) return;
    if (!canUseWebAudio || !webAudioScript) {
      setMessage('Choose Auto Web Page or Home Web Page and fix required fields before adding audio.');
      return;
    }

    const looksLikeAudio = selectedFile.type.startsWith('audio/') || /\.(mp3|m4a|mpeg|wav|aac|ogg)$/i.test(selectedFile.name);
    if (!looksLikeAudio) {
      setMessage('Please choose an MP3 or audio file.');
      return;
    }

    try {
      const audioDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Could not read the audio file.'));
        reader.readAsDataURL(selectedFile);
      });

      setAudioReview({
        templateType: data.templateType as 'auto' | 'home',
        quoteNumber: data.quoteNumber,
        clientFullName: data.clientFullName,
        script: webAudioScript,
        audioDataUrl,
        mimeType: selectedFile.type || 'audio/mpeg',
        generatedAt: new Date().toISOString(),
      });
      recordRecentQuote('Added Audio File');
      setMessage(`${selectedFile.name} added to the webpage quote. Copy or download the web HTML to include it.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not read the audio file.');
    }
  };

  const removeAudioFile = () => {
    setAudioReview(null);
    setMessage('Audio removed. The webpage quote no longer includes an audio section.');
  };

  const downloadHtml = () => {
    const blob = new Blob([rendered.html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.clientFullName.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_${data.templateType}_quote.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    recordRecentQuote('Downloaded HTML');
  };

  const downloadWebPageHtml = () => {
    if (!renderedWebPage) return;
    const blob = new Blob([renderedWebPage.html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const webType = outputMode === 'commercialWebpage' ? 'commercial_auto' : data.templateType;
    a.download = `${data.clientFullName.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_${webType}_web_quote.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    recordRecentQuote('Downloaded Web Page');
    setMessage('Webpage HTML downloaded.');
  };

  const syncToGmail = async () => {
    await copyRichHtml();
    const params = new URLSearchParams({
      view: 'cm',
      fs: '1',
      to: data.clientEmail || '',
      bcc: 'Save@BillLayneInsurance.com',
      su: rendered.subject,
    });
    window.open(`https://mail.google.com/mail/?${params.toString()}`, '_blank', 'noopener,noreferrer');
    recordRecentQuote('Synced Gmail');
    setMessage('Styled email copied and Gmail compose opened. Click the message body and press Ctrl+V to paste the formatted template.');
  };

  const syncPdfVerificationToGmail = async () => {
    const pdfEmail = buildPdfVerificationEmail(data);
    await copyRichHtml(pdfEmail.html, pdfEmail.text);
    const params = new URLSearchParams({
      view: 'cm',
      fs: '1',
      to: data.clientEmail || '',
      bcc: 'Save@BillLayneInsurance.com',
      su: pdfEmail.subject,
    });
    window.open(`https://mail.google.com/mail/?${params.toString()}`, '_blank', 'noopener,noreferrer');
    recordRecentQuote('Synced PDF Email');
    const attachmentNote = file ? ` Attach ${file.name} before sending.` : ' Attach the carrier PDF before sending.';
    setMessage(`PDF verification email copied and Gmail compose opened. Click the body, press Ctrl+V, then attach the PDF.${attachmentNote}`);
  };

  const downloadPdfVerificationEmail = () => {
    const pdfEmail = buildPdfVerificationEmail(data);
    const blob = new Blob([pdfEmail.html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = pdfEmail.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    recordRecentQuote('Downloaded PDF Email');
    setMessage('PDF verification email HTML downloaded. Attach the carrier PDF before sending from Gmail.');
  };

  const recordRecentQuote = (action: string) => {
    const next: RecentQuote[] = [
      {
        id: `${Date.now()}`,
        client: data.clientFullName || 'Unnamed client',
        templateType: data.templateType,
        carrier: CARRIERS[data.carrierId]?.displayName || data.carrierId,
        action,
        savedAt: new Date().toISOString(),
      },
      ...recentQuotes,
    ].slice(0, 8);
    localStorage.setItem(recentStorageKey, JSON.stringify(next));
    setRecentQuotes(next);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <div className="brand-mark"><Wand2 size={20} /></div>
          <div>
            <h1>Quote Template Studio</h1>
            <p>Bill Layne Insurance Agency</p>
          </div>
        </div>
        <div className="header-meta">
          <span className={`status-pill ${canExport ? 'ok' : 'hold'}`}>{canExport ? 'Ready to send' : 'Needs review'}</span>
          <span className="header-context">{CARRIERS[data.carrierId]?.displayName || data.carrierId} · {data.clientFullName || 'New client'}</span>
        </div>
        <div className="export-actions">
          <button onClick={startNewQuote}><RefreshCw size={16} /> New Quote</button>
          {outputMode === 'email' ? (
            <>
              <button onClick={copyText}><Clipboard size={16} /> Copy Text</button>
              <button onClick={copyHtml} disabled={!canExport}><Clipboard size={16} /> Copy HTML</button>
              <button onClick={syncPdfVerificationToGmail} disabled={!canExport}><Mail size={16} /> PDF Email</button>
              <button onClick={downloadPdfVerificationEmail} disabled={!canExport}><FileText size={16} /> PDF HTML</button>
              <button onClick={downloadHtml} disabled={!canExport}><Download size={16} /> Download</button>
              <button className="accent" onClick={syncToGmail} disabled={!canExport}><Mail size={16} /> Sync Gmail</button>
            </>
          ) : (
            <>
              <button onClick={copyWebPageHtml} disabled={!renderedWebPage || dataErrors.length > 0}><Clipboard size={16} /> Copy Web HTML</button>
              <button className="accent" onClick={downloadWebPageHtml} disabled={!renderedWebPage || dataErrors.length > 0}><Download size={16} /> Download Web</button>
            </>
          )}
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <section className="panel step-panel">
            <div className="step-head">
              <span className="step-num">1</span>
              <div>
                <h2>Pick the quote type</h2>
                <p>Sets the form, parser, and templates</p>
              </div>
            </div>
            <div className="type-grid" role="group" aria-label="Template type">
              {QUOTE_TYPE_OPTIONS.map(({ id, label, hint, Icon }) => (
                <button key={id} className={`type-card ${quoteType === id ? 'active' : ''}`} onClick={() => loadSample(id)}>
                  <span className="type-icon"><Icon size={18} /></span>
                  <strong>{label}</strong>
                  <span className="type-hint">{hint}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="panel step-panel">
            <div className="step-head">
              <span className="step-num">2</span>
              <div>
                <h2>Upload &amp; parse the carrier PDF</h2>
                <p>Gemini fills the quote form for you</p>
              </div>
            </div>
            <label className="drop-zone">
              <input
                type="file"
                accept=".pdf,application/pdf,image/*"
                onChange={(event) => handleFileSelected(event.target.files?.[0] || null)}
              />
              <span className="drop-icon"><Upload size={20} /></span>
              <strong>{file ? file.name : 'Choose PDF or image'}</strong>
              <span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Drop it here or click to browse'}</span>
            </label>
            {templateSuggestion && templateSuggestion !== quoteType && (
              <div className="suggestion-box">
                <span>This file looks like a <strong>{templateSuggestion}</strong> quote.</span>
                <button onClick={applyTemplateSuggestion}>Switch</button>
              </div>
            )}
            <textarea
              className="textarea"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="Optional parsing notes, e.g. carrier quoted multiple plans; use EFT option."
            />
            <button className="primary-button" onClick={handleParse} disabled={isProcessing}>
              <Wand2 size={16} /> {isProcessing ? 'Parsing...' : 'Parse with Gemini'}
            </button>
          </section>

          <section className="panel step-panel">
            <div className="step-head">
              <span className="step-num">3</span>
              <div>
                <h2>Choose the output</h2>
                <p>Email and web page templates stay independent</p>
              </div>
            </div>
            <div className="output-grid" role="group" aria-label="Output mode">
              <button className={`output-card ${outputMode === 'email' ? 'active' : ''}`} onClick={() => setOutputMode('email')}>
                <span className="output-icon"><Mail size={18} /></span>
                <span className="output-copy">
                  <strong>Gmail Email</strong>
                  <span>Paste-ready, Gmail-safe quote email</span>
                </span>
              </button>
              <button
                className={`output-card ${outputMode === 'webpage' ? 'active' : ''}`}
                onClick={() => setOutputMode('webpage')}
                disabled={!['auto', 'home'].includes(data.templateType)}
              >
                <span className="output-icon"><Globe size={18} /></span>
                <span className="output-copy">
                  <strong>{data.templateType === 'home' ? 'Home Web Page' : 'Auto Web Page'}</strong>
                  <span>{['auto', 'home'].includes(data.templateType) ? 'Customer quote page with Accept button' : 'Available for auto and home quotes'}</span>
                </span>
              </button>
              <button
                className={`output-card ${outputMode === 'commercialWebpage' ? 'active' : ''}`}
                onClick={() => setOutputMode('commercialWebpage')}
                disabled={data.templateType !== 'auto'}
              >
                <span className="output-icon"><Truck size={18} /></span>
                <span className="output-copy">
                  <strong>Commercial Auto Page</strong>
                  <span>{data.templateType === 'auto' ? 'Business vehicles, drivers & liability' : 'Available for auto quotes'}</span>
                </span>
              </button>
            </div>

            {outputMode === 'email' && (
              <div className="sub-block">
                <div className="sub-block-title"><Scissors size={14} /> Email style</div>
                <div className="chip-row" role="group" aria-label="Email mode">
                  {emailModeOptions(data.templateType).map((option) => (
                    <button key={option.id} className={`chip-btn ${emailMode === option.id ? 'active' : ''}`} onClick={() => setEmailMode(option.id)}>
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="helper-copy">Short Close is the condensed version for ready-to-buy clients. Elite styles use the premium Gmail layout for welcome emails and quote presentations.</p>
              </div>
            )}

            {outputMode === 'webpage' && (
              <div className="sub-block">
                <div className="sub-block-title"><Volume2 size={14} /> Optional audio review</div>
                <p className="helper-copy">Copy the script into your audio creator, then add the finished MP3. No audio file means no audio section on the page.</p>
                <textarea className="textarea audio-script-box" value={webAudioScript} readOnly />
                <div className="button-row">
                  <button className="ghost-button" onClick={copyAudioScript} disabled={!webAudioScript}>
                    <Clipboard size={15} /> Copy Script
                  </button>
                  <label className={`ghost-button audio-upload-label ${!canUseWebAudio ? 'disabled' : ''}`}>
                    <Upload size={15} /> {activeAudioReview ? 'Replace Audio' : 'Add MP3 / Audio'}
                    <input
                      type="file"
                      accept="audio/mpeg,audio/mp3,audio/wav,audio/aac,audio/ogg,audio/*"
                      disabled={!canUseWebAudio}
                      onChange={(event) => {
                        void addAudioFile(event.target.files?.[0] || null);
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                </div>
                {activeAudioReview && (
                  <div className="suggestion-box">
                    <span>Audio is added to this webpage quote.</span>
                    <button onClick={removeAudioFile}>Remove</button>
                  </div>
                )}
              </div>
            )}
          </section>

          <QuoteEditor data={data} setData={setData} update={update} />
        </aside>

        <main className="workspace">
          {message && <div className="notice">{message}</div>}

          <div className="content-grid">
            <section className="preview-panel">
              <div className="preview-toolbar">
                <div className="preview-title">
                  <p className="eyebrow">{isWebOutput ? 'Live Web Page Output' : 'Live Gmail Output'}</p>
                  <h2>{previewTitle}</h2>
                  <p>{previewSubhead}</p>
                </div>
                <div className="preview-tools">
                  <div className="device-toggle" role="group" aria-label="Preview width">
                    <button className={previewDevice === 'desktop' ? 'active' : ''} onClick={() => setPreviewDevice('desktop')}>
                      <Monitor size={14} /> Desktop
                    </button>
                    <button className={previewDevice === 'mobile' ? 'active' : ''} onClick={() => setPreviewDevice('mobile')}>
                      <Smartphone size={14} /> Mobile
                    </button>
                  </div>
                  <span className="byte-count">{previewByteCount.toLocaleString()} bytes</span>
                </div>
              </div>
              <div className={`preview-stage ${previewDevice}`}>
                <iframe title={isWebOutput ? `${outputMode === 'commercialWebpage' ? 'commercial auto' : data.templateType} webpage quote preview` : 'Gmail quote preview'} srcDoc={previewHtml} />
              </div>
            </section>

            <IntegrityPanel
              integrity={integrity}
              dataErrors={dataErrors}
              data={data}
              reviewItems={reviewItems}
              reviewedKeys={reviewedKeySet}
              setReviewedKeys={setReviewedKeys}
              readiness={readiness}
              canExport={canExport}
              recentQuotes={recentQuotes}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

function QuoteEditor({
  data,
  setData,
  update,
}: {
  data: QuoteData;
  setData: React.Dispatch<React.SetStateAction<QuoteData>>;
  update: (patch: Partial<QuoteData>) => void;
}) {
  const setCarrier = (carrierId: CarrierId) => update({ carrierId } as Partial<QuoteData>);

  return (
    <section className="panel step-panel editor-panel">
      <div className="step-head">
        <span className="step-num">4</span>
        <div>
          <h2>Review &amp; edit the data</h2>
          <p>Every change updates the live preview instantly</p>
        </div>
      </div>

      <div className="form-grid">
        <Field label="First Name" value={data.clientFirstName} onChange={(value) => update({ clientFirstName: value } as Partial<QuoteData>)} />
        <Field label="Full Name" value={data.clientFullName} onChange={(value) => update({ clientFullName: value } as Partial<QuoteData>)} />
        <Field label="Client Email" value={data.clientEmail} onChange={(value) => update({ clientEmail: value } as Partial<QuoteData>)} />
        <Field label="Hero Image URL" value={data.heroImageUrl || ''} placeholder="Optional direct Imgur image link" onChange={(value) => update({ heroImageUrl: value } as Partial<QuoteData>)} />
        <label className="field">
          <span>Carrier</span>
          <select value={data.carrierId} onChange={(event) => setCarrier(event.target.value as CarrierId)}>
            {carrierOptions.map((carrier) => (
              <option key={carrier.id} value={carrier.id}>{carrier.displayName}</option>
            ))}
          </select>
        </label>
        <Field label="Quote Number" value={data.quoteNumber} onChange={(value) => update({ quoteNumber: value } as Partial<QuoteData>)} />
        <Field label="Quote Date" type="date" value={data.quoteDate} onChange={(value) => update({ quoteDate: value } as Partial<QuoteData>)} />
        <Field label="Effective" type="date" value={data.effectiveDate} onChange={(value) => update({ effectiveDate: value } as Partial<QuoteData>)} />
        <Field label="Expires" type="date" value={data.expiryDate} onChange={(value) => update({ expiryDate: value } as Partial<QuoteData>)} />
      </div>

      <Field
        label="Carriers Shopped"
        value={data.carriersShoppedNames.join(', ')}
        onChange={(value) => update({ carriersShoppedNames: value.split(',').map((item) => item.trim()).filter(Boolean) } as Partial<QuoteData>)}
      />

      {data.templateType === 'auto' ? (
        <AutoFields data={data} setData={setData} />
      ) : data.templateType === 'home' ? (
        <HomeFields data={data} setData={setData} />
      ) : data.templateType === 'motorcycle' ? (
        <MotorcycleFields data={data} setData={setData} />
      ) : data.templateType === 'renters' ? (
        <RentersFields data={data} setData={setData} />
      ) : (
        <DwellingFields data={data} setData={setData} />
      )}
    </section>
  );
}

function AutoFields({ data, setData }: { data: AutoQuoteData; setData: React.Dispatch<React.SetStateAction<QuoteData>> }) {
  const updateAuto = (patch: Partial<AutoQuoteData>) => setData((current) => ({ ...current, ...patch }) as AutoQuoteData);
  const updateCoverages = (patch: Partial<AutoQuoteData['coverages']>) => updateAuto({ coverages: { ...data.coverages, ...patch } });
  const updatePayment = (patch: Partial<AutoQuoteData['paymentOptions']>) => updateAuto({ paymentOptions: { ...data.paymentOptions, ...patch } });
  const updateVehicle = (index: number, patch: Partial<AutoQuoteData['vehicles'][number]>) => {
    const vehicles = data.vehicles.map((vehicle, vehicleIndex) => (vehicleIndex === index ? { ...vehicle, ...patch } : vehicle));
    updateAuto({ vehicles });
  };
  const updateDriver = (index: number, patch: Partial<AutoQuoteData['drivers'][number]>) => {
    const drivers = data.drivers.map((driver, driverIndex) => (driverIndex === index ? { ...driver, ...patch } : driver));
    updateAuto({ drivers });
  };
  const parseVehicleCoverageLines = (value: string) =>
    value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, ...rest] = line.split(':');
        return {
          emoji: 'Check',
          name: name.trim() || 'Coverage',
          limitOrDeductible: rest.join(':').trim() || 'Included',
          status: 'included' as const,
        };
      });

  return (
    <>
      <h3 className="form-section-title">Auto Payment</h3>
      <div className="form-grid">
        <Field label="Term Months" value={String(data.termMonths)} onChange={(value) => updateAuto({ termMonths: numberValue(value) === 12 ? 12 : 6 })} />
        <Field label="Total Premium" value={String(data.totalPremium)} onChange={(value) => updateAuto({ totalPremium: numberValue(value) })} />
        <Field label="EFT Down" value={String(data.paymentOptions.eft.downPayment)} onChange={(value) => updatePayment({ eft: { ...data.paymentOptions.eft, downPayment: numberValue(value) } })} />
        <Field label="EFT Recurring" value={String(data.paymentOptions.eft.recurringAmount)} onChange={(value) => updatePayment({ eft: { ...data.paymentOptions.eft, recurringAmount: numberValue(value) } })} />
        <Field label="EFT Payment Count" value={String(data.paymentOptions.eft.recurringCount)} onChange={(value) => updatePayment({ eft: { ...data.paymentOptions.eft, recurringCount: numberValue(value) } })} />
        <Field label="PIF Total" value={String(data.paymentOptions.paidInFull.total)} onChange={(value) => updatePayment({ paidInFull: { ...data.paymentOptions.paidInFull, total: numberValue(value) } })} />
        <Field label="PIF Savings" value={String(data.paymentOptions.paidInFull.savings)} onChange={(value) => updatePayment({ paidInFull: { ...data.paymentOptions.paidInFull, savings: numberValue(value) } })} />
      </div>

      <h3 className="form-section-title">Auto Coverages</h3>
      <div className="form-grid">
        <Field label="Bodily Injury" value={data.coverages.bodilyInjuryLimit} onChange={(value) => updateCoverages({ bodilyInjuryLimit: value })} />
        <Field label="Property Damage" value={data.coverages.propertyDamageLimit} onChange={(value) => updateCoverages({ propertyDamageLimit: value })} />
        <Field label="Uninsured Motorist" value={data.coverages.uninsuredMotoristLimit} onChange={(value) => updateCoverages({ uninsuredMotoristLimit: value })} />
        <Field label="Underinsured Motorist" value={data.coverages.underinsuredMotoristLimit || ''} onChange={(value) => updateCoverages({ underinsuredMotoristLimit: value })} />
        <Field label="Medical Payments" value={data.coverages.medicalPayments ? String(data.coverages.medicalPayments) : ''} onChange={(value) => updateCoverages({ medicalPayments: optionalNumberValue(value) })} />
        <Field label="Comp Deductible" value={data.coverages.comprehensiveDeductible ? String(data.coverages.comprehensiveDeductible) : ''} onChange={(value) => updateCoverages({ comprehensiveDeductible: optionalNumberValue(value) })} />
        <Field label="Collision Deductible" value={data.coverages.collisionDeductible ? String(data.coverages.collisionDeductible) : ''} onChange={(value) => updateCoverages({ collisionDeductible: optionalNumberValue(value) })} />
        <Field label="Rental Reimbursement" value={data.coverages.rentalReimbursement || ''} onChange={(value) => updateCoverages({ rentalReimbursement: value })} />
        <Field label="Towing / Roadside" value={data.coverages.towing || ''} onChange={(value) => updateCoverages({ towing: value })} />
        <Field label="Custom Equipment" value={data.coverages.customEquipment ? String(data.coverages.customEquipment) : ''} onChange={(value) => updateCoverages({ customEquipment: optionalNumberValue(value) })} />
      </div>

      <h3 className="form-section-title">Vehicles</h3>
      {data.vehicles.map((vehicle, index) => (
        <div key={`${vehicle.vinLast8}-${index}`} className="subform-card">
          <div className="form-grid">
            <Field label={`Vehicle ${index + 1} Year`} value={String(vehicle.year || '')} onChange={(value) => updateVehicle(index, { year: numberValue(value) })} />
            <Field label="Make" value={vehicle.make || ''} onChange={(value) => updateVehicle(index, { make: value })} />
            <Field label="Model" value={vehicle.model || ''} onChange={(value) => updateVehicle(index, { model: value })} />
            <Field label="VIN / Last 8" value={vehicle.vinLast8 || ''} onChange={(value) => updateVehicle(index, { vinLast8: value })} />
            <Field label="Garaging ZIP" value={vehicle.garagingZip || ''} onChange={(value) => updateVehicle(index, { garagingZip: value })} />
            <Field label="Vehicle Premium" value={String(vehicle.vehiclePremium || '')} onChange={(value) => updateVehicle(index, { vehiclePremium: numberValue(value) })} />
            <label className="field">
              <span>Coverage Type</span>
              <select value={vehicle.coverageType} onChange={(event) => updateVehicle(index, { coverageType: event.target.value as AutoQuoteData['vehicles'][number]['coverageType'] })}>
                <option value="full_coverage">Full Coverage</option>
                <option value="liability_only">Liability Only</option>
              </select>
            </label>
          </div>
          <TextArea
            label="Vehicle Coverage Lines"
            value={(vehicle.coverages || []).map((coverage) => `${coverage.name}: ${coverage.limitOrDeductible}`).join('\n')}
            placeholder="Comprehensive: $500 deductible"
            onChange={(value) => updateVehicle(index, { coverages: parseVehicleCoverageLines(value) })}
          />
        </div>
      ))}

      <h3 className="form-section-title">Drivers</h3>
      {data.drivers.map((driver, index) => (
        <div key={`${driver.name}-${index}`} className="subform-card">
          <div className="form-grid">
            <Field label={`Driver ${index + 1} Name`} value={driver.name || ''} onChange={(value) => updateDriver(index, { name: value })} />
            <Field label="Age" value={String(driver.age || '')} onChange={(value) => updateDriver(index, { age: numberValue(value) })} />
            <Field label="Years Licensed" value={String(driver.yearsLicensed || '')} onChange={(value) => updateDriver(index, { yearsLicensed: numberValue(value) })} />
            <label className="field">
              <span>Relationship</span>
              <select value={driver.relationship} onChange={(event) => updateDriver(index, { relationship: event.target.value as AutoQuoteData['drivers'][number]['relationship'] })}>
                <option value="insured">Insured</option>
                <option value="spouse">Spouse</option>
                <option value="child">Child</option>
                <option value="excluded">Excluded</option>
              </select>
            </label>
          </div>
        </div>
      ))}

      <TextArea
        label="Discounts"
        value={data.discounts.map((discount) => discount.label).join('\n')}
        placeholder="Multi-Policy"
        onChange={(value) => updateAuto({ discounts: value.split('\n').map((label) => label.trim()).filter(Boolean).map((label) => ({ emoji: 'Check', label })) })}
      />
      <JsonEditor data={data} setData={setData} />
    </>
  );
}

function HomeFields({ data, setData }: { data: HomeQuoteData; setData: React.Dispatch<React.SetStateAction<QuoteData>> }) {
  const updateHome = (patch: Partial<HomeQuoteData>) => setData((current) => ({ ...current, ...patch }) as HomeQuoteData);
  const updateCoverages = (patch: Partial<HomeQuoteData['coverages']>) => updateHome({ coverages: { ...data.coverages, ...patch } });
  const tiv = data.coverages.coverageA + data.coverages.coverageB + data.coverages.coverageC;
  return (
    <>
      <h3 className="form-section-title">Home Quote Basics</h3>
      <div className="form-grid">
        <Field label="Policy Type" value={data.policyType} onChange={(value) => updateHome({ policyType: value as HomeQuoteData['policyType'] })} />
        <Field label="Annual Premium" value={String(data.annualPremium)} onChange={(value) => updateHome({ annualPremium: numberValue(value) })} />
        <Field label="Base Premium" value={String(data.basePremium)} onChange={(value) => updateHome({ basePremium: numberValue(value) })} />
        <Field label="All Peril Ded." value={String(data.allPerilDeductible)} onChange={(value) => updateHome({ allPerilDeductible: numberValue(value) })} />
        <Field label="Wind/Hail Ded." value={data.windHailDeductible ? String(data.windHailDeductible) : ''} onChange={(value) => updateHome({ windHailDeductible: optionalNumberValue(value) })} />
      </div>
      <Field label="Property Address" value={data.propertyAddress} onChange={(value) => updateHome({ propertyAddress: value })} />

      <h3 className="form-section-title">Property Details</h3>
      <div className="form-grid">
        <Field label="Year Built" value={String(data.yearBuilt || '')} onChange={(value) => updateHome({ yearBuilt: numberValue(value) })} />
        <Field label="Square Feet" value={data.squareFeet ? String(data.squareFeet) : ''} onChange={(value) => updateHome({ squareFeet: optionalNumberValue(value) })} />
        <Field label="Construction" value={data.constructionType || ''} onChange={(value) => updateHome({ constructionType: value })} />
        <Field label="Roof Year" value={data.roofYear ? String(data.roofYear) : ''} onChange={(value) => updateHome({ roofYear: optionalNumberValue(value) })} />
        <Field label="Roof Material" value={data.roofMaterial || ''} onChange={(value) => updateHome({ roofMaterial: value })} />
        <Field label="Protection Class" value={data.protectionClass || ''} placeholder="4" onChange={(value) => updateHome({ protectionClass: value })} />
        <Field label="Fire Distance" value={data.fireDistance || ''} placeholder="Confirm" onChange={(value) => updateHome({ fireDistance: value })} />
        <label className="field">
          <span>Monitored Alarm</span>
          <select value={data.hasMonitoredAlarm ? 'yes' : 'no'} onChange={(event) => updateHome({ hasMonitoredAlarm: event.target.value === 'yes' })}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>
      </div>

      <h3 className="form-section-title">Home Coverages</h3>
      <div className="form-grid">
        <Field label="Coverage A" value={String(data.coverages.coverageA)} onChange={(value) => updateCoverages({ coverageA: numberValue(value) })} />
        <Field label="Coverage B" value={String(data.coverages.coverageB)} onChange={(value) => updateCoverages({ coverageB: numberValue(value) })} />
        <Field label="Coverage C" value={String(data.coverages.coverageC)} onChange={(value) => updateCoverages({ coverageC: numberValue(value) })} />
        <Field label="Coverage D" value={String(data.coverages.coverageD)} onChange={(value) => updateCoverages({ coverageD: Number.isFinite(Number(value.replace(/[$,]/g, ''))) ? numberValue(value) : value })} />
        <Field label="Coverage E" value={String(data.coverages.coverageE)} onChange={(value) => updateCoverages({ coverageE: numberValue(value) })} />
        <Field label="Coverage F" value={String(data.coverages.coverageF)} onChange={(value) => updateCoverages({ coverageF: numberValue(value) })} />
        <label className="field">
          <span>Dwelling Settlement</span>
          <select value={data.dwellingLossSettlement} onChange={(event) => updateHome({ dwellingLossSettlement: event.target.value as HomeQuoteData['dwellingLossSettlement'] })}>
            <option value="Replacement Cost">Replacement Cost</option>
            <option value="Actual Cash Value">Actual Cash Value</option>
          </select>
        </label>
        <label className="field">
          <span>Personal Property Settlement</span>
          <select value={data.personalPropertyLossSettlement} onChange={(event) => updateHome({ personalPropertyLossSettlement: event.target.value as HomeQuoteData['personalPropertyLossSettlement'] })}>
            <option value="Replacement Cost">Replacement Cost</option>
            <option value="Actual Cash Value">Actual Cash Value</option>
          </select>
        </label>
      </div>

      <TextArea
        label="Endorsements"
        value={data.endorsements.map((endorsement) => `${endorsement.name} | ${endorsement.subLabel} | ${endorsement.amount}`).join('\n')}
        placeholder="Water Backup | Up to $10K coverage | Included"
        onChange={(value) => updateHome({
          endorsements: value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
            const [name, subLabel, amount] = line.split('|').map((part) => part.trim());
            return { emoji: 'Check', name: name || 'Endorsement', subLabel: subLabel || '', amount: amount || 'Included' };
          }),
        })}
      />

      <TextArea
        label="Discounts"
        value={data.discounts.map((discount) => discount.label).join('\n')}
        placeholder="Multi-Policy"
        onChange={(value) => updateHome({ discounts: value.split('\n').map((label) => label.trim()).filter(Boolean).map((label) => ({ emoji: 'Check', label })) })}
      />

      <div className="metric-strip">
        <span>Combined Coverage Value</span>
        <strong>${tiv.toLocaleString()}</strong>
      </div>
      <JsonEditor data={data} setData={setData} />
    </>
  );
}

function MotorcycleFields({ data, setData }: { data: MotorcycleQuoteData; setData: React.Dispatch<React.SetStateAction<QuoteData>> }) {
  const updateMotorcycle = (patch: Partial<MotorcycleQuoteData>) => setData((current) => ({ ...current, ...patch }) as MotorcycleQuoteData);
  return (
    <>
      <div className="form-grid">
        <Field label="Annual Premium" value={String(data.annualPremium)} onChange={(value) => updateMotorcycle({ annualPremium: numberValue(value) })} />
        <Field label="PIF Savings" value={String(data.pifSavings || 0)} onChange={(value) => updateMotorcycle({ pifSavings: numberValue(value) })} />
        <Field label="Down Payment" value={String(data.downPayment || 0)} onChange={(value) => updateMotorcycle({ downPayment: numberValue(value) })} />
        <Field label="Recurring" value={String(data.recurringPayment || 0)} onChange={(value) => updateMotorcycle({ recurringPayment: numberValue(value) })} />
      </div>
      <Field
        label="Motorcycle"
        value={[data.bike.year, data.bike.make, data.bike.model, data.bike.trim].filter(Boolean).join(' ')}
        onChange={(value) => {
          const parts = value.split(' ');
          const year = Number(parts.shift()) || data.bike.year;
          updateMotorcycle({ bike: { ...data.bike, year, make: parts.shift() || data.bike.make, model: parts.join(' ') || data.bike.model } });
        }}
      />
      <div className="metric-strip">
        <span>Monthly Equivalent</span>
        <strong>${(data.annualPremium / 12).toFixed(2)}/mo</strong>
      </div>
      <MiniList title="Coverage Highlights" lines={data.coverages.slice(0, 5).map((coverage) => `${coverage.name}: ${coverage.limit}`)} />
      <MiniList title="Riders" lines={data.riders.map((rider) => `${rider.name} - ${rider.yearsRiding} yrs riding - ${rider.relationship}`)} />
      <JsonEditor data={data} setData={setData} />
    </>
  );
}

function RentersFields({ data, setData }: { data: RentersQuoteData; setData: React.Dispatch<React.SetStateAction<QuoteData>> }) {
  const updateRenters = (patch: Partial<RentersQuoteData>) => setData((current) => ({ ...current, ...patch }) as RentersQuoteData);
  return (
    <>
      <div className="form-grid">
        <Field label="Annual Premium" value={String(data.annualPremium)} onChange={(value) => updateRenters({ annualPremium: numberValue(value) })} />
        <Field label="Coverage C" value={String(data.coverages.coverageC)} onChange={(value) => updateRenters({ coverages: { ...data.coverages, coverageC: numberValue(value) } })} />
        <Field label="Liability" value={String(data.coverages.coverageE)} onChange={(value) => updateRenters({ coverages: { ...data.coverages, coverageE: numberValue(value) } })} />
        <Field label="Deductible" value={String(data.coverages.deductible)} onChange={(value) => updateRenters({ coverages: { ...data.coverages, deductible: numberValue(value) } })} />
      </div>
      <Field
        label="Unit Street Address"
        value={data.unit.streetAddress}
        onChange={(value) => updateRenters({ unit: { ...data.unit, streetAddress: value } })}
      />
      <div className="metric-strip">
        <span>Monthly Equivalent</span>
        <strong>${(data.annualPremium / 12).toFixed(2)}/mo</strong>
      </div>
      <MiniList title="Insureds" lines={data.insureds.map((insured) => `${insured.name} - age ${insured.age} - ${insured.relationship.replace('_', ' ')}`)} />
      <MiniList title="Endorsements" lines={data.endorsements.map((endorsement) => `${endorsement.name}: ${endorsement.limit}`)} />
      <JsonEditor data={data} setData={setData} />
    </>
  );
}

function DwellingFields({ data, setData }: { data: DwellingQuoteData; setData: React.Dispatch<React.SetStateAction<QuoteData>> }) {
  const updateDwelling = (patch: Partial<DwellingQuoteData>) => setData((current) => ({ ...current, ...patch }) as DwellingQuoteData);
  const updateProperty = (patch: Partial<DwellingQuoteData['property']>) => updateDwelling({ property: { ...data.property, ...patch } });
  const updateRental = (patch: Partial<DwellingQuoteData['rental']>) => updateDwelling({ rental: { ...data.rental, ...patch } });
  return (
    <>
      <div className="form-grid">
        <Field label="Form Code" value={data.formCode} onChange={(value) => updateDwelling({ formCode: value as DwellingQuoteData['formCode'] })} />
        <Field label="Annual Premium" value={String(data.annualPremium)} onChange={(value) => updateDwelling({ annualPremium: numberValue(value) })} />
        <Field label="Coverage A" value={String(data.coverages.coverageA)} onChange={(value) => updateDwelling({ coverages: { ...data.coverages, coverageA: numberValue(value) } })} />
        <Field label="Fair Rental Value" value={String(data.coverages.coverageD)} onChange={(value) => updateDwelling({ coverages: { ...data.coverages, coverageD: numberValue(value) } })} />
      </div>
      <Field
        label="Rental Property Address"
        value={data.property.streetAddress}
        onChange={(value) => updateProperty({ streetAddress: value })}
      />
      <div className="form-grid">
        <Field label="City" value={data.property.city || ''} onChange={(value) => updateProperty({ city: value })} />
        <Field label="State" value={data.property.state || ''} onChange={(value) => updateProperty({ state: value })} />
        <Field label="ZIP" value={data.property.zip || ''} onChange={(value) => updateProperty({ zip: value })} />
        <Field label="Year Built" value={data.property.yearBuilt ? String(data.property.yearBuilt) : ''} onChange={(value) => updateProperty({ yearBuilt: numberValue(value) })} />
        <Field label="Square Feet" value={data.property.squareFeet ? String(data.property.squareFeet) : ''} onChange={(value) => updateProperty({ squareFeet: optionalNumberValue(value) })} />
        <Field label="Construction" value={data.property.constructionType || ''} onChange={(value) => updateProperty({ constructionType: value })} />
        <Field label="Roof Type" value={data.property.roofType || ''} onChange={(value) => updateProperty({ roofType: value })} />
        <Field label="Roof Age" value={data.property.roofAge ? String(data.property.roofAge) : ''} onChange={(value) => updateProperty({ roofAge: optionalNumberValue(value) })} />
        <Field label="Bedrooms" value={data.property.bedrooms ? String(data.property.bedrooms) : ''} onChange={(value) => updateProperty({ bedrooms: optionalNumberValue(value) })} />
        <Field label="Bathrooms" value={data.property.bathrooms ? String(data.property.bathrooms) : ''} onChange={(value) => updateProperty({ bathrooms: optionalNumberValue(value) })} />
        <Field label="Foundation" value={data.property.foundationType || ''} onChange={(value) => updateProperty({ foundationType: value })} />
        <Field label="HVAC Type" value={data.property.hvacType || ''} onChange={(value) => updateProperty({ hvacType: value })} />
        <Field label="HVAC Age" value={data.property.hvacAge ? String(data.property.hvacAge) : ''} onChange={(value) => updateProperty({ hvacAge: optionalNumberValue(value) })} />
        <Field label="Electrical Amps" value={data.property.electricalAmps ? String(data.property.electricalAmps) : ''} onChange={(value) => updateProperty({ electricalAmps: optionalNumberValue(value) })} />
        <Field label="Panel Type" value={data.property.panelType || ''} onChange={(value) => updateProperty({ panelType: value })} />
        <Field label="Plumbing" value={data.property.plumbingType || ''} onChange={(value) => updateProperty({ plumbingType: value })} />
        <Field label="Use Type" value={data.rental.useType} onChange={(value) => updateRental({ useType: value as DwellingQuoteData['rental']['useType'] })} />
        <Field label="Current Status" value={data.rental.currentStatus} onChange={(value) => updateRental({ currentStatus: value as DwellingQuoteData['rental']['currentStatus'] })} />
        <Field label="Lease Type" value={data.rental.leaseType} onChange={(value) => updateRental({ leaseType: value as DwellingQuoteData['rental']['leaseType'] })} />
        <Field label="Monthly Rent" value={String(data.rental.monthlyRent || '')} onChange={(value) => updateRental({ monthlyRent: numberValue(value) })} />
      </div>
      <div className="metric-strip">
        <span>Fair Rental Adequacy</span>
        <strong>{data.coverages.coverageD >= data.rental.monthlyRent * 12 ? 'OK' : 'Review'}</strong>
      </div>
      <MiniList title="Owners" lines={data.owners.map((owner) => `${owner.name} - ${owner.relationship}`)} />
      <MiniList title="DP Coverage Highlights" lines={[`Coverage D is Fair Rental Value: $${data.coverages.coverageD.toLocaleString()}`, `Wind/Hail Deductible: ${data.coverages.windHailDeductible}`, `Use: ${data.rental.useType} - ${data.rental.currentStatus}`]} />
      <JsonEditor data={data} setData={setData} />
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea className="textarea" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function MiniList({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="mini-list">
      <span>{title}</span>
      {lines.map((line) => <p key={line}>{line}</p>)}
    </div>
  );
}

function JsonEditor({
  data,
  setData,
}: {
  data: QuoteData;
  setData: React.Dispatch<React.SetStateAction<QuoteData>>;
}) {
  const [draft, setDraft] = useState(() => JSON.stringify(data, null, 2));
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setDraft(JSON.stringify(data, null, 2));
  }, [data]);

  const apply = () => {
    try {
      const parsed = JSON.parse(draft) as QuoteData;
      setData(parsed);
      setError(null);
    } catch {
      setError('JSON is not valid yet.');
    }
  };

  return (
    <div className="json-editor">
      <div className="json-header">
        <span>Advanced JSON</span>
        <button onClick={apply}>Apply JSON</button>
      </div>
      <textarea value={draft} onChange={(event) => setDraft(event.target.value)} spellCheck={false} />
      {error && <p>{error}</p>}
    </div>
  );
}

function IntegrityPanel({
  integrity,
  dataErrors,
  data,
  reviewItems,
  reviewedKeys,
  setReviewedKeys,
  readiness,
  canExport,
  recentQuotes,
}: {
  integrity: ReturnType<typeof runIntegrityChecks>;
  dataErrors: string[];
  data: QuoteData;
  reviewItems: ReviewItem[];
  reviewedKeys: Set<string>;
  setReviewedKeys: React.Dispatch<React.SetStateAction<string[]>>;
  readiness: Array<{ label: string; ok: boolean; detail: string }>;
  canExport: boolean;
  recentQuotes: RecentQuote[];
}) {
  const tiv = data.templateType === 'home'
    ? data.coverages.coverageA + data.coverages.coverageB + data.coverages.coverageC
    : null;
  const items = [
    { label: 'Gmail byte limit', ok: integrity.byteCount < 102_400, detail: `${integrity.byteCount.toLocaleString()} bytes` },
    { label: 'HTML closes cleanly', ok: integrity.errors.every((e) => !e.includes('</html>')), detail: '</html> present' },
    { label: 'Clean agency mailto', ok: integrity.errors.every((e) => !e.includes('mailto')), detail: 'Save@BillLayneInsurance.com' },
    { label: 'No banned circles/headshot', ok: integrity.errors.every((e) => !e.includes('border-radius') && !e.includes('Banned')), detail: 'Gmail-safe rows' },
    { label: 'Schema JSON-LD', ok: integrity.errors.every((e) => !e.includes('application/ld+json')), detail: 'Quotation metadata' },
    { label: 'BCC reminder', ok: true, detail: 'BCC Save@BillLayneInsurance.com when drafting' },
  ];

  return (
    <aside className="integrity-panel">
      <div className="panel-heading-row">
        <h3>Ready to Send</h3>
        <span className={canExport ? 'status-pill ok' : 'status-pill hold'}>{canExport ? 'Ready' : 'Review'}</span>
      </div>
      {readiness.map((item) => (
        <div key={item.label} className="check-row compact">
          {item.ok ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
          <div>
            <strong>{item.label}</strong>
            <span>{item.detail}</span>
          </div>
        </div>
      ))}

      <div className="panel-heading-row with-space">
        <h3>Review Before Export</h3>
        <button className="text-button" onClick={() => setReviewedKeys(reviewItems.map((item) => item.key))}>Mark all</button>
      </div>
      {reviewItems.map((item) => (
        <label key={item.key} className={`review-row ${reviewedKeys.has(item.key) ? 'reviewed' : ''}`}>
          <input
            type="checkbox"
            checked={reviewedKeys.has(item.key)}
            onChange={(event) => {
              setReviewedKeys((current) => {
                const next = new Set(current);
                if (event.target.checked) next.add(item.key);
                else next.delete(item.key);
                return Array.from(next);
              });
            }}
          />
          <span>
            <strong>{item.label}</strong>
            <em>{item.value}</em>
          </span>
        </label>
      ))}

      <h3 className="section-spacer">Technical Checks</h3>
      {items.map((item) => (
        <div key={item.label} className="check-row">
          {item.ok ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
          <div>
            <strong>{item.label}</strong>
            <span>{item.detail}</span>
          </div>
        </div>
      ))}
      {tiv !== null && (
        <div className="tiv-box">
          <span>TIV compliance</span>
          <strong>${tiv.toLocaleString()}</strong>
          <p>A + B + C only. Loss of Use, Liability, and Med Pay excluded.</p>
        </div>
      )}
      {(dataErrors.length > 0 || integrity.errors.length > 0) && (
        <div className="error-box">
          {[...dataErrors, ...integrity.errors].map((error) => <p key={error}>{error}</p>)}
        </div>
      )}
      {integrity.warnings.length > 0 && (
        <div className="warning-box">
          {integrity.warnings.map((warning) => <p key={warning}>{warning}</p>)}
        </div>
      )}
      {recentQuotes.length > 0 && (
        <>
          <div className="panel-heading-row with-space">
            <h3><History size={15} /> Recent Quotes</h3>
          </div>
          <div className="recent-list">
            {recentQuotes.map((quote) => (
              <div key={quote.id}>
                <strong>{quote.client}</strong>
                <span>{quote.templateType} · {quote.carrier}</span>
                <em>{quote.action} · {new Date(quote.savedAt).toLocaleString()}</em>
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}

export default App;
