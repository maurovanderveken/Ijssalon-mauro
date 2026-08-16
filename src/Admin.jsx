import React, { useState, useEffect, useCallback } from "react";
import { storage } from "./storage";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  X,
  Lock,
  ChevronDown,
  Eye,
  ArchiveX,
} from "lucide-react";

const COLORS = {
  bg: "#FFFBF7",
  panel: "#FFFFFF",
  ink: "#2B2420",
  inkSoft: "#948A80",
  line: "#EEE3DA",
  accent: "#C0304A",
  accentSoft: "#F7E3E6",
  card: "#FBEEEB",
  ok: "#4d7c0f",
};

const PALETTES = [
  { name: "Aardbei", colors: ["#fb7185", "#fecdd3", "#9f1239"] },
  { name: "Framboos", colors: ["#c026d3", "#f0abfc", "#701a75"] },
  { name: "Kersen", colors: ["#e11d48", "#fda4af", "#881337"] },
  { name: "Pistache", colors: ["#84cc16", "#d9f99d", "#3f6212"] },
  { name: "Vanille", colors: ["#fde68a", "#fff7d6", "#b45309"] },
  { name: "Speculoos", colors: ["#b45309", "#fed7aa", "#78350f"] },
  { name: "Citroen", colors: ["#facc15", "#fef9c3", "#a16207"] },
  { name: "Chocolade", colors: ["#78350f", "#a8763e", "#2f1a0d"] },
  { name: "Munt", colors: ["#5eead4", "#ccfbf1", "#0f766e"] },
  { name: "Karamel", colors: ["#d97706", "#fed7aa", "#92400e"] },
];

const STATUSES = ["Nieuw", "In behandeling", "Klaar voor afhaling", "Afgehaald", "Geannuleerd"];
const STATUS_COLORS = {
  Nieuw: "#C0304A",
  "In behandeling": "#b45309",
  "Klaar voor afhaling": "#0f766e",
  Afgehaald: "#4d7c0f",
  Geannuleerd: "#948A80",
};

const euro = (n) => (n || 0).toLocaleString("nl-BE", { style: "currency", currency: "EUR" });
const slug = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function ScoopThumb({ colors, size = 44 }) {
  const [a, b, c] = colors;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 3.5,
        flexShrink: 0,
        background: `radial-gradient(circle at 30% 25%, ${a} 0%, ${b} 55%, ${c} 100%)`,
      }}
    />
  );
}

export default function AdminApp() {
  const [authed, setAuthed] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");

  const tryLogin = () => {
    if (passcode === "mauro2026") {
      setAuthed(true);
      setAuthError("");
    } else {
      setAuthError("Onjuiste toegangscode.");
    }
  };

  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("dashboard");

  const [editingProduct, setEditingProduct] = useState(null); // product object or "new"
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);
  const [confirmArchiveId, setConfirmArchiveId] = useState(null);
  const [notice, setNotice] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const p = await storage.get("ijs-products", true);
      setProducts(p && p.value ? JSON.parse(p.value) : []);
    } catch (_) {
      setProducts([]);
    }
    try {
      const o = await storage.get("ijs-orders", true);
      setOrders(o && o.value ? JSON.parse(o.value) : []);
    } catch (_) {
      setOrders([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (authed) loadAll();
  }, [authed, loadAll]);

  const persistProducts = async (next) => {
    setProducts(next);
    try {
      await storage.set("ijs-products", JSON.stringify(next), true);
    } catch (_) {}
  };

  const persistOrders = async (next) => {
    setOrders(next);
    try {
      await storage.set("ijs-orders", JSON.stringify(next), true);
    } catch (_) {}
  };

  const saveProduct = (draft) => {
    let next;
    if (draft._isNew) {
      const id = slug(draft.name) || "smaak-" + Date.now();
      next = [...products, { ...draft, id, _isNew: undefined }];
    } else {
      next = products.map((p) => (p.id === draft.id ? draft : p));
    }
    persistProducts(next);
    setEditingProduct(null);
  };

  const deleteProduct = (id) => {
    persistProducts(products.filter((p) => p.id !== id));
    setConfirmDeleteId(null);
  };

  const changeOrderStatus = (number, status) => {
    const next = orders.map((o) => (o.number === number ? { ...o, status } : o));
    persistOrders(next);
    if (status === "Klaar voor afhaling") {
      setNotice(`Klant van bestelling #${number} zou nu automatisch een e-mail ontvangen (niet actief in dit prototype).`);
      setTimeout(() => setNotice(null), 5000);
    }
  };

  const archiveOrder = (number) => {
    persistOrders(orders.filter((o) => o.number !== number));
    setConfirmArchiveId(null);
    setViewOrder(null);
  };

  const counts = {
    Nieuw: orders.filter((o) => o.status === "Nieuw").length,
    "In behandeling": orders.filter((o) => o.status === "In behandeling").length,
    "Klaar voor afhaling": orders.filter((o) => o.status === "Klaar voor afhaling").length,
    Totaal: orders.length,
  };

  if (!authed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: COLORS.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Fraunces', serif",
        }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600&family=Inter:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; } body { margin: 0; }
          input:focus-visible, button:focus-visible { outline: 2px solid ${COLORS.accent}; outline-offset: 2px; }`}</style>
        <div
          style={{
            width: 320,
            background: "#fff",
            border: `1px solid ${COLORS.line}`,
            borderRadius: 20,
            padding: 32,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: COLORS.accentSoft,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Lock size={20} color={COLORS.accent} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 4px" }}>Beheerpaneel</h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: COLORS.inkSoft, margin: "0 0 20px" }}>
            IJsjes Mauro — alleen voor medewerkers
          </p>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tryLogin()}
            placeholder="Toegangscode"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: `1px solid ${authError ? COLORS.accent : COLORS.line}`,
              fontFamily: "Inter, sans-serif",
              fontSize: 15,
              marginBottom: 8,
            }}
          />
          {authError && (
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: COLORS.accent, margin: "0 0 8px" }}>
              {authError}
            </p>
          )}
          <button
            onClick={tryLogin}
            style={{
              width: "100%",
              marginTop: 8,
              padding: "13px",
              borderRadius: 999,
              border: "none",
              background: COLORS.accent,
              color: "#fff",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Inloggen
          </button>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: COLORS.inkSoft, marginTop: 16 }}>
            Prototype-toegang: code is <strong>mauro2026</strong>. Vervang dit door echte accounts bij productie.
          </p>
        </div>
      </div>
    );
  }

  if (!ready) return null;

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; } body { margin: 0; }
        button { font-family: inherit; }
        input, textarea, select { font-family: 'Inter', sans-serif; }
        button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
          outline: 2px solid ${COLORS.accent}; outline-offset: 2px;
        }
        table { border-collapse: collapse; width: 100%; }
        th { text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: ${COLORS.inkSoft}; padding: 10px 12px; border-bottom: 1px solid ${COLORS.line}; }
        td { padding: 12px; border-bottom: 1px solid ${COLORS.line}; font-size: 14px; vertical-align: middle; }
        .row-hover:hover { background: #FFF8F3; }
        @media (max-width: 720px) {
          .sidebar-label { display: none; }
          .sidebar { width: 64px !important; }
          .admin-main { padding: 16px !important; }
        }
      `}</style>

      {/* Sidebar */}
      <nav
        className="sidebar"
        style={{
          width: 210,
          flexShrink: 0,
          background: "#fff",
          borderRight: `1px solid ${COLORS.line}`,
          padding: "24px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 18,
            fontWeight: 500,
            padding: "0 10px 20px",
            color: COLORS.ink,
          }}
        >
          <span className="sidebar-label">IJsjes Mauro</span>
          <span style={{ display: "none" }}>IM</span>
        </div>
        {[
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          { id: "products", label: "Producten", icon: Package },
          { id: "orders", label: "Bestellingen", icon: ClipboardList },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 10,
              border: "none",
              background: tab === id ? COLORS.accentSoft : "transparent",
              color: tab === id ? COLORS.accent : COLORS.ink,
              fontWeight: tab === id ? 600 : 500,
              fontSize: 14,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <Icon size={18} />
            <span className="sidebar-label">{label}</span>
          </button>
        ))}
      </nav>

      {/* Main */}
      <main className="admin-main" style={{ flex: 1, padding: "28px 32px", overflowX: "auto" }}>
        {notice && (
          <div
            style={{
              background: "#0f766e",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: 10,
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            {notice}
          </div>
        )}

        {tab === "dashboard" && (
          <div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 26, margin: "0 0 20px" }}>
              Dashboard
            </h1>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
              {[
                ["Nieuwe bestellingen", counts.Nieuw],
                ["In behandeling", counts["In behandeling"]],
                ["Klaar voor afhaling", counts["Klaar voor afhaling"]],
                ["Totaal bestellingen", counts.Totaal],
              ].map(([label, val]) => (
                <div
                  key={label}
                  style={{
                    background: "#fff",
                    border: `1px solid ${COLORS.line}`,
                    borderRadius: 16,
                    padding: 20,
                  }}
                >
                  <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Fraunces', serif" }}>{val}</div>
                  <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 19, margin: "32px 0 12px" }}>
              Recente bestellingen
            </h2>
            <div style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 16, overflow: "hidden" }}>
              <table>
                <thead>
                  <tr>
                    <th>Nummer</th>
                    <th>Klant</th>
                    <th>Totaal</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((o) => (
                    <tr key={o.number} className="row-hover">
                      <td>#{o.number}</td>
                      <td>{o.naam}</td>
                      <td>{euro(o.total)}</td>
                      <td>
                        <StatusPill status={o.status} />
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: COLORS.inkSoft, padding: 24 }}>
                        Nog geen bestellingen.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "products" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 26, margin: 0 }}>
                Producten
              </h1>
              <button
                onClick={() =>
                  setEditingProduct({
                    _isNew: true,
                    name: "",
                    description: "",
                    price: 11,
                    stock: 10,
                    colors: PALETTES[0].colors,
                  })
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 16px",
                  borderRadius: 999,
                  border: "none",
                  background: COLORS.accent,
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                <Plus size={16} /> Nieuwe smaak
              </button>
            </div>

            <div style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 16, overflow: "hidden" }}>
              <table>
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Naam</th>
                    <th>Prijs / L</th>
                    <th>Voorraad</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="row-hover">
                      <td>
                        <ScoopThumb colors={p.colors} />
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>{euro(p.price)}</td>
                      <td>{p.stock} L</td>
                      <td>
                        {p.stock <= 0 ? (
                          <span style={{ color: COLORS.accent, fontWeight: 600, fontSize: 13 }}>Uitverkocht</span>
                        ) : (
                          <span style={{ color: COLORS.ok, fontWeight: 600, fontSize: 13 }}>Op voorraad</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button
                            aria-label="Bewerken"
                            onClick={() => setEditingProduct(p)}
                            style={iconBtnStyle}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            aria-label="Verwijderen"
                            onClick={() => setConfirmDeleteId(p.id)}
                            style={{ ...iconBtnStyle, color: COLORS.accent }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: COLORS.inkSoft, padding: 24 }}>
                        Nog geen smaken toegevoegd.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 26, margin: "0 0 20px" }}>
              Bestellingen
            </h1>
            <div style={{ background: "#fff", border: `1px solid ${COLORS.line}`, borderRadius: 16, overflow: "hidden" }}>
              <table>
                <thead>
                  <tr>
                    <th>Nummer</th>
                    <th>Datum</th>
                    <th>Klant</th>
                    <th>Totaal</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.number} className="row-hover">
                      <td>#{o.number}</td>
                      <td>{new Date(o.date).toLocaleDateString("nl-BE")}</td>
                      <td>{o.naam}</td>
                      <td>{euro(o.total)}</td>
                      <td>
                        <StatusSelect value={o.status} onChange={(s) => changeOrderStatus(o.number, s)} />
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button aria-label="Bekijken" onClick={() => setViewOrder(o)} style={iconBtnStyle}>
                            <Eye size={15} />
                          </button>
                          <button
                            aria-label="Archiveren"
                            onClick={() => setConfirmArchiveId(o.number)}
                            style={{ ...iconBtnStyle, color: COLORS.accent }}
                          >
                            <ArchiveX size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: COLORS.inkSoft, padding: 24 }}>
                        Nog geen bestellingen.
                      </td>
                    </tr>
                  )}
                </tbody>
         
