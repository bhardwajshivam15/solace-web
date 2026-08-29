import { useEffect, useState } from "react";
import { Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FLAT";
  value: number;
  maxBonusAmount: number | null;
  minimumTopUpAmount: number | null;
  maxRedemptions: number | null;
  perUserLimit: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
  timesUsed: number;
}

interface CouponForm {
  id: string | null;
  code: string;
  discountType: "PERCENTAGE" | "FLAT";
  value: string;
  maxBonusAmount: string;
  minimumTopUpAmount: string;
  maxRedemptions: string;
  perUserLimit: string;
  expiresAt: string;
}

const emptyForm: CouponForm = {
  id: null,
  code: "",
  discountType: "FLAT",
  value: "",
  maxBonusAmount: "",
  minimumTopUpAmount: "",
  maxRedemptions: "",
  perUserLimit: "1",
  expiresAt: "",
};

function toForm(coupon: Coupon): CouponForm {
  return {
    id: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    value: String(coupon.value),
    maxBonusAmount: coupon.maxBonusAmount != null ? String(coupon.maxBonusAmount) : "",
    minimumTopUpAmount: coupon.minimumTopUpAmount != null ? String(coupon.minimumTopUpAmount) : "",
    maxRedemptions: coupon.maxRedemptions != null ? String(coupon.maxRedemptions) : "",
    perUserLimit: String(coupon.perUserLimit),
    expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
  };
}

export default function AdminCoupons() {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<CouponForm | null>(null);
  const [saving, setSaving] = useState(false);

  const loadCoupons = () => {
    setLoading(true);
    apiRequest<{ data: Coupon[] }>("/admin/coupons", { token })
      .then((response) => setCoupons(response.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load coupons."))
      .finally(() => setLoading(false));
  };

  useEffect(loadCoupons, [token]);

  const openCreate = () => {
    setError(null);
    setEditing(emptyForm);
  };

  const openEdit = (coupon: Coupon) => {
    setError(null);
    setEditing(toForm(coupon));
  };

  const toggleActive = async (coupon: Coupon) => {
    setError(null);
    try {
      await apiRequest(`/admin/coupons/${coupon.id}/status`, {
        method: "PATCH",
        token,
        body: { active: !coupon.active },
      });
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? { ...c, active: !c.active } : c)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update this coupon's status.");
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);
    const body = {
      code: editing.code.trim(),
      discountType: editing.discountType,
      value: Number(editing.value),
      maxBonusAmount: editing.maxBonusAmount ? Number(editing.maxBonusAmount) : null,
      minimumTopUpAmount: editing.minimumTopUpAmount ? Number(editing.minimumTopUpAmount) : null,
      maxRedemptions: editing.maxRedemptions ? Number(editing.maxRedemptions) : null,
      perUserLimit: editing.perUserLimit ? Number(editing.perUserLimit) : 1,
      expiresAt: editing.expiresAt ? new Date(editing.expiresAt).toISOString() : null,
    };
    try {
      if (editing.id) {
        await apiRequest(`/admin/coupons/${editing.id}`, { method: "PATCH", token, body });
      } else {
        await apiRequest("/admin/coupons", { method: "POST", token, body });
      }
      setEditing(null);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
      loadCoupons();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this coupon.");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="text-xl font-bold text-ink-900">{editing.id ? "Edit Coupon" : "New Coupon"}</h1>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-5 space-y-4 rounded-2xl border border-gray-100 bg-white p-6">
          <div>
            <label className="text-xs font-medium text-gray-500">Code</label>
            <input
              value={editing.code}
              onChange={(event) => setEditing({ ...editing, code: event.target.value.toUpperCase() })}
              placeholder="WELCOME50"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink-900 uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Type</label>
              <select
                value={editing.discountType}
                onChange={(event) => setEditing({ ...editing, discountType: event.target.value as "PERCENTAGE" | "FLAT" })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink-900"
              >
                <option value="FLAT">Flat (₹)</option>
                <option value="PERCENTAGE">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                {editing.discountType === "PERCENTAGE" ? "Percentage" : "Bonus Amount (₹)"}
              </label>
              <input
                type="number"
                value={editing.value}
                onChange={(event) => setEditing({ ...editing, value: event.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink-900"
              />
            </div>
          </div>

          {editing.discountType === "PERCENTAGE" && (
            <div>
              <label className="text-xs font-medium text-gray-500">Max Bonus Amount (₹, optional)</label>
              <p className="text-[11px] text-gray-400">Caps the bonus so a large top-up can't produce an unlimited bonus.</p>
              <input
                type="number"
                value={editing.maxBonusAmount}
                onChange={(event) => setEditing({ ...editing, maxBonusAmount: event.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink-900"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-500">Minimum Top-up (₹, optional)</label>
            <input
              type="number"
              value={editing.minimumTopUpAmount}
              onChange={(event) => setEditing({ ...editing, minimumTopUpAmount: event.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Max Total Redemptions (optional)</label>
              <p className="text-[11px] text-gray-400">Blank = unlimited.</p>
              <input
                type="number"
                value={editing.maxRedemptions}
                onChange={(event) => setEditing({ ...editing, maxRedemptions: event.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink-900"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Per-user Limit</label>
              <input
                type="number"
                value={editing.perUserLimit}
                onChange={(event) => setEditing({ ...editing, perUserLimit: event.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink-900"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Expires On (optional)</label>
            <input
              type="date"
              value={editing.expiresAt}
              onChange={(event) => setEditing({ ...editing, expiresAt: event.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink-900"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !editing.code.trim() || !editing.value}
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setEditing(null)}
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-ink-900 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-900">Coupons</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Create Coupon
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          Coupon saved.
        </div>
      )}

      <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {loading && <p className="px-5 py-6 text-center text-sm text-gray-400">Loading...</p>}

        {!loading &&
          coupons.map((coupon) => (
            <div key={coupon.id} className="flex items-center gap-3 px-5 py-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink-900">{coupon.code}</p>
                <p className="text-xs text-gray-400">
                  {coupon.discountType === "FLAT" ? `₹${coupon.value} flat bonus` : `${coupon.value}% bonus`}
                  {coupon.discountType === "PERCENTAGE" && coupon.maxBonusAmount != null && ` (capped at ₹${coupon.maxBonusAmount})`}
                  {" · "}
                  {coupon.timesUsed}
                  {coupon.maxRedemptions != null ? ` / ${coupon.maxRedemptions}` : ""} used
                  {coupon.expiresAt &&
                    ` · Expires ${new Date(coupon.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  coupon.active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                }`}
              >
                {coupon.active ? "Active" : "Inactive"}
              </span>
              <button
                onClick={() => openEdit(coupon)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-ink-900 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() => toggleActive(coupon)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  coupon.active
                    ? "border-red-200 text-red-500 hover:bg-red-50"
                    : "border-green-200 text-green-600 hover:bg-green-50"
                }`}
              >
                {coupon.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          ))}

        {!loading && coupons.length === 0 && (
          <p className="px-5 py-6 text-center text-sm text-gray-400">No coupons yet.</p>
        )}
      </div>
    </div>
  );
}
