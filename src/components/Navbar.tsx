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
      <div className="header-brand">
        <span className="store-brand">
          👕 TOKO PAKAIAN BAGUS &amp; TASYA
        </span>
        {" "}
        <span className="role-badge">
          {role}
        </span>
      </div>

      <nav className="header-actions" aria-label="Navigasi toko">
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
      </nav>
    </header>
  );
};
