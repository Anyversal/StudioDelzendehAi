import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  FileSearch,
  LockKeyhole,
  MonitorUp,
  MousePointer2,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';

type DraftType = 'email' | 'meeting' | 'sms';
type SavedState = { text: string; result: string; draftType: DraftType };
const STORAGE_KEY = 'omnicursor-local-v1';
const MAX_INPUT_CHARS = 12_000;

function readSavedState(): SavedState {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return { text: '', result: '', draftType: 'email' };
    const parsed = JSON.parse(value) as Partial<SavedState>;
    return {
      text: typeof parsed.text === 'string' ? parsed.text.slice(0, MAX_INPUT_CHARS) : '',
      result: typeof parsed.result === 'string' ? parsed.result.slice(0, 4_000) : '',
      draftType: parsed.draftType === 'meeting' || parsed.draftType === 'sms' ? parsed.draftType : 'email',
    };
  } catch {
    return { text: '', result: '', draftType: 'email' };
  }
}

// A deterministic, offline helper. It does not call an AI model or send data anywhere.
function summarizeLocally(value: string): string {
  const text = value.replace(/\s+/g, ' ').trim();
  if (!text) return 'برای شروع، متن موردنظر را در کادر وارد کنید. تحلیل در این نسخه به‌صورت محلی و ساده انجام می‌شود.';
  const sentences = (text.match(/[^.!؟?؛\n]+[.!؟?؛]?/g) ?? [text])
    .map((part) => part.trim())
    .filter((part) => part.length > 18);
  const points = sentences.slice(0, 3);
  const words = text.match(/[\p{L}\p{N}]{4,}/gu) ?? [];
  const counts = new Map<string, number>();
  for (const word of words) {
    const key = word.toLocaleLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const keywords = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
  return [
    'خلاصهٔ محلی (بدون مدل هوش مصنوعی):',
    ...(points.length ? points.map((point, index) => `${index + 1}. ${point}`) : [`متن واردشده: ${text.slice(0, 500)}`]),
    keywords.length ? `واژه‌های پرتکرار: ${keywords.join('، ')}` : '',
    'برای تحلیل عمیق، OCR یا جست‌وجوی وب باید سرویس امن سمت سرور جداگانه پیکربندی شود.',
  ].filter(Boolean).join('\n');
}

export function OmniCursorModule() {
  const initial = readSavedState();
  const [text, setText] = useState(initial.text);
  const [result, setResult] = useState(initial.result);
  const [draftType, setDraftType] = useState<DraftType>(initial.draftType);
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState('');
  const [notice, setNotice] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const tokenEstimate = Math.ceil(text.length / 4);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ text, result, draftType } satisfies SavedState));
    } catch {
      setNotice('ذخیره‌سازی محلی در دسترس نیست؛ لطفاً متن حساس را در این مرورگر نگه ندارید.');
    }
  }, [text, result, draftType]);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  useEffect(() => () => stream?.getTracks().forEach((track) => track.stop()), [stream]);

  const startScreenShare = async () => {
    setNotice('');
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setNotice('اشتراک‌گذاری صفحه در این مرورگر پشتیبانی نمی‌شود. از مرورگر به‌روز و اتصال HTTPS استفاده کنید.');
      return;
    }
    try {
      const next = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      next.getVideoTracks()[0]?.addEventListener('ended', () => setStream(null), { once: true });
      setStream(next);
      setPreview('');
      setNotice('صفحه فقط در همین مرورگر نمایش داده می‌شود و در این نسخه به سرور ارسال نمی‌گردد.');
    } catch {
      setNotice('اشتراک‌گذاری آغاز نشد یا لغو شد؛ برای حفظ حریم خصوصی هیچ تصویری دریافت نشده است.');
    }
  };

  const stopScreenShare = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setPreview('');
    setNotice('اشتراک‌گذاری صفحه متوقف شد.');
  };

  const capturePreview = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setNotice('تصویر صفحه هنوز آماده نیست؛ چند لحظه صبر کنید و دوباره تلاش کنید.');
      return;
    }
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1280 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPreview(canvas.toDataURL('image/jpeg', 0.72));
    setNotice('تصویر نمونه فقط در حافظهٔ این صفحه است؛ OCR در این نسخه فعال نیست و تصویر ارسال نمی‌شود.');
  };

  const analyzeLocally = () => {
    if (text.length > MAX_INPUT_CHARS) {
      setNotice(`برای کنترل مصرف و ذخیره‌سازی، متن را به حداکثر ${MAX_INPUT_CHARS.toLocaleString('fa-IR')} نویسه محدود کنید.`);
      return;
    }
    setResult(summarizeLocally(text));
    setNotice('تحلیل محلی انجام شد؛ هیچ توکنی مصرف و هیچ داده‌ای به سرویس بیرونی ارسال نشد.');
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setNotice('نتیجه کپی شد.');
    } catch {
      setNotice('دسترسی کپی در مرورگر مجاز نیست.');
    }
  };

  const clearLocalData = () => {
    setText('');
    setResult('');
    setPreview('');
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage may be disabled */ }
    setNotice('متن و نتیجهٔ ذخیره‌شدهٔ این ابزار از حافظهٔ محلی پاک شد.');
  };

  const draftTitle = draftType === 'email' ? 'پیش‌نویس ایمیل' : draftType === 'meeting' ? 'پیش‌نویس صورت‌جلسه' : 'پیش‌نویس پیامک';
  const draft = result ? `${draftTitle}\n\n${result}\n\nاین متن پیش‌نویس است و پیش از ارسال باید توسط شما بازبینی شود.` : 'ابتدا متنی را تحلیل کنید تا پیش‌نویس محلی ساخته شود.';

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300"><MousePointer2 /></div>
            <div>
              <h2 className="font-black text-slate-100">OmniCursor — دستیار صفحه‌محور</h2>
              <p className="mt-1 text-xs text-slate-400">نسخهٔ اولیهٔ امن: اشتراک‌گذاری با اجازه، تحلیل محلی و ذخیرهٔ اختیاری در همین مرورگر.</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${online ? 'border-emerald-500/30 text-emerald-300' : 'border-indigo-500/30 text-indigo-300'}`}>
            {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {online ? 'اتصال اینترنت برقرار' : 'حالت آفلاین'}
          </div>
        </div>
        <div className="mt-4 flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-6 text-amber-100">
          <LockKeyhole className="mt-1 h-4 w-4 shrink-0 text-amber-300" />
          <p>این نسخه کل صفحهٔ رایانه یا برنامه‌های دیگر را خودکار نمی‌خواند، جست‌وجوی وب/هوش مصنوعی ابری ندارد و عملیات خارجی انجام نمی‌دهد. برای استفادهٔ سراسری در برنامه‌ها، اپ دسکتاپ و مجوزهای جداگانهٔ سیستم‌عامل لازم است.</p>
        </div>
      </section>

      {notice && <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-slate-200"><span>{notice}</span><button aria-label="بستن پیام" onClick={() => setNotice('')}><X className="h-4 w-4" /></button></div>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-cyan-300"><FileSearch className="h-4 w-4" />اشتراک‌گذاری انتخابی صفحه</h3>
            <span className="text-[10px] text-slate-500">اختیاری و با تأیید مرورگر</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {!stream ? <button onClick={startScreenShare} className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950"><MonitorUp className="h-4 w-4" />انتخاب صفحه/پنجره</button> : <>
              <button onClick={capturePreview} className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-100">گرفتن تصویر نمونه (محلی)</button>
              <button onClick={stopScreenShare} className="rounded-xl border border-rose-500/30 px-4 py-2 text-xs text-rose-300">توقف اشتراک</button>
            </>}
          </div>
          {stream && <video ref={videoRef} autoPlay muted playsInline className="max-h-64 w-full rounded-xl border border-slate-700 bg-black object-contain" />}
          {preview && <img src={preview} alt="تصویر نمونهٔ محلی از صفحه" className="max-h-64 w-full rounded-xl border border-slate-700 object-contain" />}
          <p className="text-[11px] leading-5 text-slate-400">مرورگر اجازهٔ انتخاب پنجره/صفحه را می‌گیرد و هر زمان می‌توانید اشتراک را متوقف کنید. تصویر نمونه در این صفحه پردازش یا بارگذاری نمی‌شود؛ قابلیت OCR هنوز متصل نیست.</p>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-amber-300">راهنمای محلی و کنترل حجم متن</h3>
            <span className="text-[10px] text-slate-400">تخمین ورودی: حدود {tokenEstimate.toLocaleString('fa-IR')} توکن</span>
          </div>
          <label htmlFor="omni-text" className="text-xs text-slate-300">متن را خودتان انتخاب و اینجا وارد کنید:</label>
          <textarea id="omni-text" rows={8} maxLength={MAX_INPUT_CHARS} value={text} onChange={(event) => setText(event.target.value)} placeholder="متن غیرحساس را وارد کنید…" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm leading-6 text-slate-100 outline-none focus:border-cyan-500" />
          <div className="flex items-center justify-between text-[10px] text-slate-500"><span>{text.length.toLocaleString('fa-IR')} / {MAX_INPUT_CHARS.toLocaleString('fa-IR')} نویسه</span><span>تحلیل محلی: ۰ توکن ابری</span></div>
          <button onClick={analyzeLocally} className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-slate-950">خلاصه‌سازی ساده و آفلاین</button>
          {result && <div className="rounded-xl border border-cyan-500/30 bg-slate-950 p-4"><div className="mb-2 flex items-center justify-between text-xs font-bold text-cyan-300"><span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" />نتیجهٔ محلی</span><button onClick={copyResult} className="flex items-center gap-1 text-slate-300"><Copy className="h-3.5 w-3.5" />کپی</button></div><p className="whitespace-pre-wrap text-xs leading-6 text-slate-200">{result}</p></div>}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-100">پیش‌نویس شخصی — ارسال خودکار خاموش</h3>
          <div className="flex gap-2">{(['email', 'meeting', 'sms'] as const).map((type) => <button key={type} onClick={() => setDraftType(type)} className={`rounded-lg px-3 py-1.5 text-xs ${draftType === type ? 'bg-amber-500 font-bold text-slate-950' : 'bg-slate-800 text-slate-300'}`}>{type === 'email' ? 'ایمیل' : type === 'meeting' ? 'صورت‌جلسه' : 'پیامک'}</button>)}</div>
        </div>
        <div className="rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-300">{draft}</div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-1 text-[11px] text-slate-400"><AlertCircle className="h-4 w-4 text-amber-300" />این نسخه فقط پیش‌نویس می‌سازد؛ ارسال ایمیل/پیامک یا دسترسی به مخاطبین پیاده‌سازی نشده است.</p>
          <button onClick={clearLocalData} className="rounded-lg border border-rose-500/30 px-3 py-2 text-xs text-rose-300">پاک‌کردن داده‌های محلی</button>
        </div>
      </section>
    </div>
  );
}
