import React from "react";

interface NavbarProps {
  role: string;
  cartCount: number;
  orderCount: number;
  canManageStore: boolean;
  onAddProduct: () => void;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onOpenSalesReports: () => void;
  onRegister: () => void;
  onLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  role,
  cartCount,
  orderCount,
  canManageStore,
  onAddProduct,
  onOpenCart,
  onOpenOrders,
  onOpenSalesReports,
  onRegister,
  onLogin,
  onLogout,
}) => {
  return (
    <header className="header-bar">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontSize: "20px",
            fontWeight: "800",
            whiteSpace: "nowrap",
          }}
        >
          👕 TOKO PAKAIAN BAGUS &amp; TASYA
        </span>
        <span
          style={{
            background: "#334155",
            color: "#cbd5e1",
            padding: "3px 9px",
            borderRadius: "12px",
            fontSize: "11px",
            whiteSpace: "nowrap",
          }}
        >
          {role}
        </span>
      </div>

      <div
        className="header-actions"
        style={{ display: "flex", gap: "8px" }}
      >
        {canManageStore && (
          <button
            type="button"
            className="action-btn success"
            onClick={onAddProduct}
          >
            ➕ Tambah Produk
          </button>
        )}
        <button
          type="button"
          className="action-btn primary"
          onClick={onOpenCart}
        >
          🛒 Keranjang ({cartCount})
        </button>
        <button
          type="button"
          className="action-btn"
          onClick={onOpenOrders}
        >
          📦 Pesanan ({orderCount})
        </button>
        {canManageStore && (
          <button
            type="button"
            className="action-btn success"
            onClick={onOpenSalesReports}
          >
            📈 Laporan Penjualan
          </button>
        )}
        <button type="button" className="action-btn" onClick={onRegister}>
          Daftar akun
        </button>
        <button type="button" className="action-btn" onClick={onLogin}>
          Login
        </button>
        <button
          type="button"
          className="action-btn"
          style={{ background: "#ef4444", borderColor: "#ef4444" }}
          onClick={onLogout}
        >
          Keluar
        </button>
      </div>
    </header>
  );
};
