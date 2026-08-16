import React, { useState, useEffect, useCallback } from "react";
import { storage } from "./storage";
import { Search, User, ShoppingBag, Plus, Minus, X, Trash2, ArrowLeft, Check } from "lucide-react";

/* ---------------------------------------------------------
   Design tokens
   Cream base, warm charcoal ink, raspberry accent, blush card bg.
   Display face: Fraunces (warm, artisanal serif) for names/brand.
   Body/UI face: Inter for prices, labels, controls.
--------------------------------------------------------- */
const COLORS = {
  bg: "#FFFBF7",
  ink: "#2B2420",
  inkSoft: "#948A80",
  line: "#EEE3DA",
  accent: "#C0304A",
  accentDeep: "#93172F",
  card: "#FBEEEB",
  soldBadge: "#2B2420",
};

const SEED_PRODUCTS = [
  {
    id: "aardbei",
    name: "Aardbei",
    description:
      "Room-ijs op basis van verse aardbeien, met stukjes fruit doorheen elke lepel. Licht en fris.",
    price: 11.0,
    stock: 12,
    colors: ["#fb7185", "#fecdd3", "#9f1239"],
  },
  {
    id: "framboos",
    name: "Framboos",
    description:
      "Pittige framboos, koud gedraaid met een vleugje citroen om de zoetheid in balans te houden.",
    price: 11.0,
    stock: 0,
    colors: ["#c026d3", "#f0abfc", "#701a75"],
  },
  {
    id: "kersen",
    name: "Kersen",
    description:
      "Krieken uit eigen streek, ingekookt tot een compote en door een romige vanillebasis geroerd.",
    price: 11.0,
    stock: 8,
    colors: ["#e11d48", "#fda4af", "#881337"],
  },
  {
    id: "pistache",
    name: "Pistache",
    description:
      "Siciliaanse pistachenoten, geroosterd en fijngemalen tot een dikke pasta die het ijs zijn kleur geeft.",
    price: 12.5,
    stock: 6,
    colors: ["#84cc16", "#d9f99d", "#3f6212"],
  },
  {
    id: "vanille",
    name: "Bourbon vanille",
    description:
      "Vanillestokjes uit Madagaskar, urenlang getrokken in room. Het huisrecept, ongewijzigd sinds het begin.",
    price: 10.5,
    stock: 15,
    colors: ["#fde68a", "#fff7d6", "#b45309"],
  },
  {
    id: "speculoos",
    name: "Speculoos",
    description:
      "Zelfgebakken speculoos, verkruimeld door een romige karamelbasis. Met een zoute ondertoon.",
    price: 11.5,
    stock: 9,
    colors: ["#b45309", "#fed7aa", "#78350f"],
  },
  {
    id: "citroen",
    name: "Citroensorbet",
    description:
      "Sorbet op basis van geperste citroen, zonder room. Verfrissend en net zuur genoeg.",
    price: 10.0,
    stock: 0,
    colors: ["#facc15", "#fef9c3", "#a16207"],
  },
  {
    id: "chocolade",
    name: "Pure chocolade",
    description:
      "Chocolade met 70% cacao, gesmolten en verwerkt tot een dichte, intense basis.",
    price: 12.0,
    stock: 7,
    colors: ["#78350f", "#a8763e", "#2f1a0d"],
  },
];

const euro = (n) =>
  n.toLocaleString("nl-BE", { style: "currency", currency: "EUR" });

/* Signature visual: layered radial-gradient "scoops" instead of stock photos.
   Keeps every card visually consistent and on-brand without external images. */
function ScoopVisual({ colors, size = "card", soldOut = false }) {
  const [a, b, c] = colors;
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: size === "card" ? 20 : 24,
        overflow: "hidden",
        background: `radial-gradient(circle at 30% 25%, ${a} 0%, ${b} 55%, ${c} 100%)`,
        filter: soldOut ? "grayscale(0.75) brightness(0.85)" : "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 70% 70%, ${c}55 0%, transparent 60%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "55%",
          height: "55%",
          left: "20%",
          top: "18%",
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 30%, ${b} 0%, ${a} 70%)`,
          boxShadow: `inset -8px -10px 24px ${c}66, inset 6px 8px 18px #ffffff55`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "38%",
          height: "38%",
          right: "12%",
          bottom: "10%",
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 30%, ${b} 0%, ${c} 75%)`,
          boxShadow: `inset -6px -8px 18px ${c}66, inset 4px 6px 14px #ffffff44`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.08,
          backgroundImage:
            "repeating-radial-gradient(circle at 50% 50%, #000 0, transparent 2px, transparent 6px)",
          mixBlendMode: "multiply",
        }}
      />
      {soldOut && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            background: COLORS.soldBadge,
            color: "#fff",
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "5px 10px",
            borderRadius: 999,
          }}
        >
          Uitverkocht
        </div>
      )}
    </div>
  );
}

function QtyStepper({ value, onChange, max }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: `1px solid ${COLORS.line}`,
        borderRadius: 999,
        overflow: "hidden",
      }}
    >
      <button
        aria-label="Minder"
        onClick={() => onChange(Math.max(1, value - 1))}
        style={stepBtnStyle}
      >
        <Minus size={16} />
      </button>
      <span
        style={{
          minWidth: 40,
          textAlign: "center",
          fontFamily: "Inter, sans-serif",
          fontWeight: 600,
          fontSize: 15,
          color: COLORS.ink,
        }}
      >
        {value} L
      </span>
      <button
        aria-label="Meer"
        onClick={() => onChange(Math.min(max, value + 1))}
        style={stepBtnStyle}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

const stepBtnStyle = {
  width: 38,
  height: 38,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: COLORS.ink,
};

export default function App() {
  const [products, setProducts] = useState(SEED_PRODUCTS);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const [view, setView] = useState("home"); // home | detail | checkout | confirmation
  const [activeId, setActiveId] = useState(null);
  const [detailQty, setDetailQty] = useState(1);

  const [cart, setCart] = useState([]); // [{id, qty}]
  const [cartOpen, setCartOpen] = useState(false);

  const [form, setForm] = useState({ naam: "", telefoon: "", email: "", opmerking: "" });
  const [errors, setErrors] = useState({});
  const [lastOrder, setLastOrder] = useState(null);

  // Load persisted catalog (shared) + cart (personal)
  useEffect(() => {
    (async () => {
      try {
        const p = await storage.get("ijs-products", true);
        if (p && p.value) setProducts(JSON.parse(p.value));
        else await storage.set("ijs-products", JSON.stringify(SEED_PRODUCTS), true);
      } catch (e) {
        /* no stored catalog yet — seed defaults stay */
        try {
          await storage.set("ijs-products", JSON.stringify(SEED_PRODUCTS), true);
        } catch (_) {}
      }
      try {
        const c = await storage.get("ijs-cart", false);
        if (c && c.value) setCart(JSON.parse(c.value));
      } catch (_) {}
      setReady(true);
    })();
  }, []);

  const persistCart = useCallback(async (next) => {
    setCart(next);
    try {
      await storage.set("ijs-cart", JSON.stringify(next), false);
    } catch (_) {}
  }, []);

  const persistProducts = useCallback(async (next) => {
    setProducts(next);
    try {
      await storage.set("ijs-products", JSON.stringify(next), true);
    } catch (_) {}
  }, []);

  const activeProduct = products.find((p) => p.id === activeId);

  const openDetail = (id) => {
    setActiveId(id);
    setDetailQty(1);
    setView("detail");
  };

  const addToCart = (id, qty) => {
    const existing = cart.find((i) => i.id === id);
    const next = existing
      ? cart.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i))
      : [...cart, { id, qty }];
    persistCart(next);
    setCartOpen(true);
  };

  const updateCartQty = (id, qty) => {
    if (qty <= 0) {
      persistCart(cart.filter((i) => i.id !== id));
      return;
    }
    persistCart(cart.map((i) => (i.id === id ? { ...i, qty } : i)));
  };

  const removeFromCart = (id) => persistCart(cart.filter((i) => i.id !== id));

  const cartLines = cart
    .map((i) => ({ ...i, product: products.find((p) => p.id === i.id) }))
    .filter((l) => l.product);
  const cartCount = cartLines.reduce((s, l) => s + l.qty, 0);
  const cartTotal = cartLines.reduce((s, l) => s + l.qty * l.product.price, 0);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  const validateForm = () => {
    const e = {};
    if (!form.naam.trim()) e.naam = "Vul je naam in";
    if (!form.telefoon.trim()) e.telefoon = "Vul je telefoonnummer in";
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email))
      e.email = "Vul een geldig e-mailadres in";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = async () => {
    if (!validateForm()) return;
    const orderNumber = "M" + Date.now().toString().slice(-6);
    const nextProducts = products.map((p) => {
      const line = cartLines.find((l) => l.id === p.id);
      if (!line) return p;
      const newStock = Math.max(0, p.stock - line.qty);
      return { ...p, stock: newStock };
    });
    persistProducts(nextProducts);

    const orderRecord = {
      number: orderNumber,
      date: new Date().toISOString(),
      naam: form.naam,
      telefoon: form.telefoon,
      email: form.email,
      opmerking: form.opmerking,
      lines: cartLines.map((l) => ({
        id: l.id,
        naam: l.product.name,
        qty: l.qty,
        price: l.product.price,
      })),
      total: cartTotal,
      status: "Nieuw",
    };
    try {
      const existing = await storage.get("ijs-orders", true);
      const list = existing && existing.value ? JSON.parse(existing.value) : [];
      await storage.set("ijs-orders", JSON.stringify([orderRecord, ...list]), true);
    } catch (_) {}

    setLastOrder({
      number: orderNumber,
      lines: cartLines,
      total: cartTotal,
      naam: form.naam,
    });
    persistCart([]);
    setForm({ naam: "", telefoon: "", email: "", opmerking: "" });
    setErrors({});
    setView("confirmation");
    setCartOpen(false);
  };

  if (!ready) return null;

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        button { font-family: inherit; }
        input, textarea { font-family: 'Inter', sans-serif; }
        button:focus-visible, input:focus-visible, textarea:focus-visible {
          outline: 2px solid ${COLORS.accent};
          outline-offset: 2px;
        }
        .fade-slide { animation: fadeSlide 0.35s ease both; }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .drawer-enter { animation: drawerIn 0.28s cubic-bezier(.22,1,.36,1) both; }
        @keyframes drawerIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .overlay-enter { animation: overlayIn 0.3s ease both; }
        @keyframes overlayIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .fade-slide, .drawer-enter, .overlay-enter { animation: none !important; }
        }
        .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -12px rgba(43,36,32,0.25); }
      `}</style>

      {/* ---------- Header ---------- */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: COLORS.bg,
          borderBottom: `1px solid ${COLORS.line}`,
        }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <button
            aria-label="Zoeken"
            onClick={() => setSearchOpen((s) => !s)}
            style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.ink }}
          >
            <Search size={22} />
          </button>
          <h1
            style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 500,
              fontSize: 26,
              letterSpacing: "-0.01em",
              margin: 0,
              flex: 1,
              textAlign: "center",
            }}
          >
            IJsjes Mauro
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <User size={22} style={{ color: COLORS.inkSoft }} aria-hidden="true" />
            <button
              aria-label="Winkelwagen"
              onClick={() => setCartOpen(true)}
              style={{
                position: "relative",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: COLORS.ink,
              }}
            >
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -8,
                    background: COLORS.accent,
                    color: "#fff",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    minWidth: 17,
                    height: 17,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
        {searchOpen && (
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 16px" }}>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek een smaak…"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 12,
                border: `1px solid ${COLORS.line}`,
                fontSize: 15,
                color: COLORS.ink,
                background: "#fff",
              }}
            />
          </div>
        )}
      </header>

      {/* ---------- Home grid ---------- */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px 80px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 20,
          }}
        >
          {filteredProducts.map((p, idx) => {
            const soldOut = p.stock <= 0;
            return (
              <button
                key={p.id}
                onClick={() => openDetail(p.id)}
                className="fade-slide card-hover"
                style={{
                  animationDelay: `${idx * 0.04}s`,
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ width: "100%", aspectRatio: "1 / 1" }}>
                  <ScoopVisual colors={p.colors} soldOut={soldOut} />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "'Fraunces', serif",
                      fontSize: 19,
                      fontWeight: 500,
                      color: COLORS.ink,
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 14,
                      color: COLORS.inkSoft,
                      marginTop: 2,
                    }}
                  >
                    {euro(p.price)} / L
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {filteredProducts.length === 0 && (
          <p style={{ textAlign: "center", color: COLORS.inkSoft, marginTop: 60, fontFamily: "Inter, sans-serif" }}>
            Geen smaken gevonden voor "{query}".
          </p>
        )}
      </main>

      {/* ---------- Product detail overlay ---------- */}
      {view === "detail" && activeProduct && (
        <div
          className="overlay-enter"
          style={{
            position: "fixed",
            inset: 0,
            background: COLORS.bg,
            zIndex: 30,
            overflowY: "auto",
          }}
        >
          <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 20px 100px" }}>
            <button
              onClick={() => setView("home")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: COLORS.ink,
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                padding: "8px 0 16px",
              }}
            >
              <ArrowLeft size={18} /> Terug
            </button>

            <div style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 24, overflow: "hidden" }}>
              <ScoopVisual colors={activeProduct.colors} size="detail" soldOut={activeProduct.stock <= 0} />
            </div>

            <h2
              style={{
                fontFamily: "'Fraunces', serif",
                fontWeight: 500,
                fontSize: 30,
                margin: "20px 0 8px",
              }}
            >
              {activeProduct.name}
            </h2>
            <p
              style={{
                fontFamily: "'Fraunces', serif",
                fontStyle: "italic",
                fontSize: 16,
                color: COLORS.inkSoft,
                lineHeight: 1.5,
                margin: "0 0 18px",
              }}
            >
              {activeProduct.description}
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 0",
                borderTop: `1px solid ${COLORS.line}`,
                borderBottom: `1px solid ${COLORS.line}`,
                marginBottom: 20,
              }}
            >
              <div>
                <div style={{ fontFamily: "Inter, sans-se
