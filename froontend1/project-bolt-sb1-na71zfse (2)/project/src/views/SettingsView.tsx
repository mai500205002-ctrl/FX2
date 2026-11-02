import { useCallback, useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Key,
  Loader2,
  AlertTriangle,
  Check,
  Trash2,
  Save,
  Plug,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, ApiError, type KeyStatusResponse } from '@/lib/api';

export default function SettingsView() {
  const [status, setStatus] = useState<KeyStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyInput, setKeyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStatus(await api.getKeyStatus());
    } catch (e) {
      setStatus({ configured: false, reason: e instanceof ApiError ? e.message : 'unreachable' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!keyInput.trim()) return;
    setSaving(true);
    setMsg(null);
    try {
      await api.setKey(keyInput.trim());
      setKeyInput('');
      setMsg({ ok: true, text: 'API key stored via backend keytar.' });
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof ApiError ? e.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setRemoving(true);
    setMsg(null);
    try {
      await api.deleteKey();
      setMsg({ ok: true, text: 'API key removed.' });
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof ApiError ? e.message : 'Remove failed.' });
    } finally {
      setRemoving(false);
    }
  };

  const backendReachable = !(status?.reason && status.reason !== 'keytar unavailable' && !loading);

  return (
    <div className="animate-appear max-w-2xl px-8 md:px-12 py-8">
      <div className="flex items-center gap-2.5 mb-2">
        <SettingsIcon size={18} className="text-signal-300" />
        <h2 className="font-display text-2xl font-semibold tracking-tight">Settings</h2>
      </div>
      <p className="text-[13px] text-base-400">
        Configure the OpenAI API key the backend uses for LLM calls. Keys are stored securely by the backend via keytar — never in the browser.
      </p>

      {/* Backend connection */}
      <Section title="Backend connection" icon={Plug}>
        <Row label="API base URL" value={<span className="font-mono text-[12px] text-base-200">{api.base}</span>} />
        <Row
          label="Status"
          value={
            loading ? (
              <span className="flex items-center gap-1.5 text-base-400 text-[12px]">
                <Loader2 size={12} className="animate-spin" /> checking…
              </span>
            ) : backendReachable ? (
              <span className="flex items-center gap-1.5 text-success text-[12px]">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> reachable
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-error text-[12px]">
                <span className="h-1.5 w-1.5 rounded-full bg-error" /> unreachable
              </span>
            )
          }
        />
        {!backendReachable && (
          <p className="text-[12px] text-base-400 mt-2">
            Set <span className="font-mono">VITE_TEXTFX_API_URL</span> in <span className="font-mono">.env</span> to point at a running backend.
          </p>
        )}
      </Section>

      {/* API key */}
      <Section title="OpenAI API key" icon={Key}>
        <Row
          label="Configured"
          value={
            loading ? (
              <span className="flex items-center gap-1.5 text-base-400 text-[12px]">
                <Loader2 size={12} className="animate-spin" /> checking…
              </span>
            ) : status?.configured ? (
              <span className="flex items-center gap-1.5 text-success text-[12px]">
                <Check size={13} /> key stored
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-warning text-[12px]">
                <span className="h-1.5 w-1.5 rounded-full bg-warning" /> not set
              </span>
            )
          }
        />
        {status?.reason && status.reason !== 'keytar unavailable' && (
          <p className="text-[11px] text-base-500 mt-1 font-mono">{status.reason}</p>
        )}

        <div className="mt-4">
          <label className="text-[12px] text-base-300 font-medium">Set a new key</label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-…"
              className="flex-1 rounded-lg ring-hairline bg-base-950 px-3 py-2 text-[13px] font-mono text-base-100 placeholder:text-base-500 outline-none focus:ring-signal-300/30"
            />
            <button
              onClick={save}
              disabled={!keyInput.trim() || saving}
              className="inline-flex items-center gap-2 rounded-lg bg-signal-300 hover:bg-signal-200 disabled:opacity-50 text-base-950 font-medium text-sm px-3 py-2 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </button>
          </div>
          <p className="text-[11px] text-base-500 mt-2">
            The key is sent to <span className="font-mono">POST /api/set-key</span> and stored in the backend's OS keychain.
          </p>
        </div>

        {status?.configured && (
          <div className="mt-4">
            <button
              onClick={remove}
              disabled={removing}
              className="inline-flex items-center gap-2 rounded-lg ring-1 ring-error/30 bg-error/10 hover:bg-error/15 text-error text-sm px-3 py-2 transition-colors"
            >
              {removing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Remove key
            </button>
          </div>
        )}

        {msg && (
          <div
            className={cn(
              'mt-4 flex items-start gap-2 rounded-lg text-[13px] px-4 py-3',
              msg.ok
                ? 'ring-1 ring-success/30 bg-success/10 text-success'
                : 'ring-1 ring-error/30 bg-error/10 text-error',
            )}
          >
            {msg.ok ? <Check size={15} className="mt-0.5 shrink-0" /> : <AlertTriangle size={15} className="mt-0.5 shrink-0" />}
            <span>{msg.text}</span>
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Key; children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-xl2 ring-hairline bg-base-900 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={15} className="text-base-300" />
        <div className="font-display font-medium text-[14px]">{title}</div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] text-base-400">{label}</span>
      <span>{value}</span>
    </div>
  );
}
