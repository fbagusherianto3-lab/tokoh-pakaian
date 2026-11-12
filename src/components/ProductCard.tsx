import React from "react";
import { DEFAULT_PRODUCT_IMAGE } from "../data/products.ts";
import type { Product } from "../types/product.ts";

interface ProductCardProps {
  product: Product;
  selectedSize: string | undefined;
  canManageStore: boolean;
  formatPrice: (price: number) => string;
  onSelectSize: (productId: number, size: string) => void;
  onAddToCart: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onAddStock: (productId: number) => void;
  onDeleteProduct: (productId: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  selectedSize,
  canManageStore,
  formatPrice,
  onSelectSize,
  onAddToCart,
  onEditProduct,
  onAddStock,
  onDeleteProduct,
}) => {
  return (
    <article className="product-card">
      <div className="product-img-wrap">
        <img
          src={product.image}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
          }}
          className="product-img"
        />
        <span
          style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            background: product.stock > 0 ? "#16a34a" : "#ef4444",
            color: "#fff",
            fontSize: "10px",
            padding: "3px 7px",
            borderRadius: "4px",
            fontWeight: "bold",
          }}
        >
          {product.stock > 0 ? `Stok: ${product.stock}` : "Habis"}
        </span>
        {canManageStore && (
          <button
            type="button"
            onClick={() => onDeleteProduct(product.id)}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "rgba(239,68,68,.9)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: "26px",
              height: "26px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "bold",
            }}
            title="Hapus Produk"
            aria-label={`Hapus ${product.name}`}
          >
            ✕
          </button>
        )}
      </div>

      <div className="product-card-content">
        <span style={{ fontSize: "11px", color: "#3b82f6", fontWeight: 700 }}>
          {product.category}
        </span>
        <h4 style={{ margin: "4px 0 8px", fontSize: "15px" }}>
          {product.name}
        </h4>
        <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "12px" }}>
          {formatPrice(product.price)}
        </div>

        <div style={{ marginBottom: "12px" }}>
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>Ukuran:</span>
            {product.sizes.map((size) => (
              <button
                key={size}
                type="button"
                className={`size-text ${selectedSize === size ? "selected" : ""}`}
                aria-pressed={selectedSize === size}
                onClick={() => onSelectSize(product.id, size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {canManageStore && (
          <div
            style={{
              display: "flex",
              gap: "4px",
              marginBottom: "8px",
            }}
          >
            <button
              type="button"
              style={{
                flex: 1,
                padding: "5px",
                background: "#e2e8f0",
                color: "#0f172a",
                border: 0,
                borderRadius: "4px",
                fontSize: "11px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
              onClick={() => onEditProduct(product)}
            >
              ✏️ Edit
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                padding: "5px",
                background: "#334155",
                color: "#fff",
                border: 0,
                borderRadius: "4px",
                fontSize: "11px",
                cursor: "pointer",
                fontWeight: 700,
              }}
              onClick={() => onAddStock(product.id)}
            >
              +5 Stok
            </button>
            <button
              type="button"
              style={{
                padding: "5px 8px",
                background: "#ef4444",
                color: "#fff",
                border: 0,
                borderRadius: "4px",
                fontSize: "11px",
                cursor: "pointer",
              }}
              onClick={() => onDeleteProduct(product.id)}
              aria-label={`Hapus ${product.name}`}
            >
              🗑️
            </button>
          </div>
        )}

        <button
          type="button"
          className="action-btn primary"
          style={{
            marginTop: "auto",
            justifyContent: "center",
            opacity: product.stock <= 0 ? 0.6 : 1,
          }}
          disabled={product.stock <= 0}
          onClick={() => onAddToCart(product)}
        >
          {product.stock > 0 ? "+ Tambah Ke Keranjang" : "Stok Habis"}
        </button>
      </div>
    </article>
  );
};
