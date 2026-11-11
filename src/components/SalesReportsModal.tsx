import React, { useMemo, useState } from "react";
import type { OrderItem } from "../types/product.ts";

interface SalesReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderItem[];
  formatRupiah: (value: number) => string;
}

interface SalesSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingProduct: { name: string; quantity: number } | null;
  revenueByPayment: Record<string, number>;
  salesByCategory: Record<string, number>;
}

const LEGACY_MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  mei: 4,
  jun: 5,
  jul: 6,
  agu: 7,
  sep: 8,
  okt: 9,
  nov: 10,
  des: 11,
};

function getOrderDate(order: OrderItem): Date | null {
  if (order.createdAt) {
    const createdAt = new Date(order.createdAt);
    return Number.isNaN(createdAt.getTime()) ? null : createdAt;
  }

  const match = /^(\d{1,2})\s+([a-z]{3})\s+(\d{4})(?:,\s*(\d{1,2})[.:](\d{2}))?$/i.exec(
    order.date.trim(),
  );
  if (!match) return null;

  const [, day, monthName, year, hour = "0", minute = "0"] = match;
  const month = LEGACY_MONTHS[monthName.toLowerCase()];
  if (month === undefined) return null;

  const parsedDate = new Date(
    Number(year),
    month,
    Number(day),
    Number(hour),
    Number(minute),
  );

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

// =====================================================
// COMPONENT
// =====================================================

export const SalesReportsModal: React.FC<SalesReportsModalProps> = ({
  isOpen,
  onClose,
  orders,
  formatRupiah,
}) => {
  const [reportTimeRange, setReportTimeRange] = useState<"all" | "today" | "month">("all");

  // Kalkulasi Laporan Penjualan
  const salesSummary = useMemo<SalesSummary>(() => {
    const now = new Date();

    const filteredOrders = orders.filter((order) => {
      if (order.status !== "Selesai" && order.status !== "Dikirim") return false;

      const orderDate = getOrderDate(order);
      if (!orderDate) return false;

      if (reportTimeRange === "today") {
        return (
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }

      if (reportTimeRange === "month") {
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }

      return true;
    });

    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const productCountMap: Record<string, number> = {};
    const categoryCountMap: Record<string, number> = {};
    const paymentMap: Record<string, number> = {};

    filteredOrders.forEach((order) => {
      const method = order.paymentMethod.split(" ")[0];
      paymentMap[method] = (paymentMap[method] || 0) + order.totalPrice;

      order.items.forEach((item) => {
        productCountMap[item.product.name] =
          (productCountMap[item.product.name] || 0) + item.quantity;

        categoryCountMap[item.product.category] =
          (categoryCountMap[item.product.category] || 0) + item.quantity;
      });
    });

    let topSellingProduct: { name: string; quantity: number } | null = null;
    Object.entries(productCountMap).forEach(([name, quantity]) => {
      if (!topSellingProduct || quantity > topSellingProduct.quantity) {
        topSellingProduct = { name, quantity };
      }
    });

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      topSellingProduct,
      revenueByPayment: paymentMap,
      salesByCategory: categoryCountMap,
    };
  }, [orders, reportTimeRange]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#1b1721",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "850px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "32px",
          color: "#f8fafc",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            paddingBottom: "16px",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "22px", color: "#fff" }}>
              📈 Laporan & Statistik Penjualan
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#94a3b8" }}>
              Ringkasan performa penjualan berdasarkan transaksi toko
            </p>
          </div>

          {/* Filter Rentang Waktu */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {(["all", "today", "month"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setReportTimeRange(range)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer",
                  background:
                    reportTimeRange === range
                      ? "#8b5cf6"
                      : "rgba(255,255,255,0.06)",
                  color: reportTimeRange === range ? "#fff" : "#cbd5e1",
                }}
              >
                {range === "all"
                  ? "Semua"
                  : range === "today"
                  ? "Hari Ini"
                  : "Bulan Ini"}
              </button>
            ))}
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: 0,
                color: "#94a3b8",
                fontSize: "20px",
                cursor: "pointer",
                marginLeft: "12px",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Grid Key Metrics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              background: "rgba(139, 92, 246, 0.1)",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              borderRadius: "16px",
              padding: "18px",
            }}
          >
            <span style={{ fontSize: "12px", color: "#a78bfa" }}>Total Omset</span>
            <div style={{ fontSize: "20px", fontWeight: "700", marginTop: "6px" }}>
              {formatRupiah(salesSummary.totalRevenue)}
            </div>
          </div>

          <div
            style={{
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              borderRadius: "16px",
              padding: "18px",
            }}
          >
            <span style={{ fontSize: "12px", color: "#60a5fa" }}>Total Transaksi</span>
            <div style={{ fontSize: "20px", fontWeight: "700", marginTop: "6px" }}>
              {salesSummary.totalOrders} Pesanan
            </div>
          </div>

          <div
            style={{
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: "16px",
              padding: "18px",
            }}
          >
            <span style={{ fontSize: "12px", color: "#34d399" }}>Rata-Rata Nilai Struk</span>
            <div style={{ fontSize: "20px", fontWeight: "700", marginTop: "6px" }}>
              {formatRupiah(salesSummary.averageOrderValue)}
            </div>
          </div>

          <div
            style={{
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              borderRadius: "16px",
              padding: "18px",
            }}
          >
            <span style={{ fontSize: "12px", color: "#fbbf24" }}>Produk Terlaris</span>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "700",
                marginTop: "6px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {salesSummary.topSellingProduct
                ? `${salesSummary.topSellingProduct.name} (${salesSummary.topSellingProduct.quantity} pcs)`
                : "-"}
            </div>
          </div>
        </div>

        {/* Visualisasi Grafik Batang (Progress Bar) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
          }}
        >
          {/* Penjualan per Kategori */}
          <div
            style={{
              background: "#120f17",
              borderRadius: "16px",
              padding: "20px",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <h4 style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#e2e8f0" }}>
              👔 Terjual Berdasarkan Kategori
            </h4>
            {Object.keys(salesSummary.salesByCategory).length === 0 ? (
              <p style={{ fontSize: "12px", color: "#64748b" }}>Belum ada data penjualan.</p>
            ) : (
              Object.entries(salesSummary.salesByCategory).map(([cat, qty]) => {
                const maxQty = Math.max(...Object.values(salesSummary.salesByCategory));
                const percentage = Math.round((qty / (maxQty || 1)) * 100);

                return (
                  <div key={cat} style={{ marginBottom: "12px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        marginBottom: "4px",
                      }}
                    >
                      <span>{cat}</span>
                      <span style={{ fontWeight: "700", color: "#a78bfa" }}>
                        {qty} pcs
                      </span>
                    </div>
                    <div
                      style={{
                        height: "8px",
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${percentage}%`,
                          background: "linear-gradient(90deg, #8b5cf6, #c084fc)",
                          borderRadius: "4px",
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Metode Pembayaran */}
          <div
            style={{
              background: "#120f17",
              borderRadius: "16px",
              padding: "20px",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <h4 style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#e2e8f0" }}>
              💳 Omset Berdasarkan Pembayaran
            </h4>
            {Object.keys(salesSummary.revenueByPayment).length === 0 ? (
              <p style={{ fontSize: "12px", color: "#64748b" }}>Belum ada data pembayaran.</p>
            ) : (
              Object.entries(salesSummary.revenueByPayment).map(([method, rev]) => {
                const maxRev = salesSummary.totalRevenue || 1;
                const percentage = Math.round((rev / maxRev) * 100);

                return (
                  <div key={method} style={{ marginBottom: "12px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        marginBottom: "4px",
                      }}
                    >
                      <span>{method}</span>
                      <span style={{ fontWeight: "700", color: "#34d399" }}>
                        {formatRupiah(rev)}
                      </span>
                    </div>
                    <div
                      style={{
                        height: "8px",
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${percentage}%`,
                          background: "linear-gradient(90deg, #10b981, #34d399)",
                          borderRadius: "4px",
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};