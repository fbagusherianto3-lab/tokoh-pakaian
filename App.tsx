import { useState } from 'react';

// --- Interface & Type Definition ---
export type Category = 'Semua' | 'Pria' | 'Wanita' | 'Unisex';
export type Size = 'S' | 'M' | 'L' | 'XL';

export interface Product {
  id: number;
  name: string;
  price: number;
  category: Category;
  sizes: Size[];
  image: string;
}

export interface CartItem {
  product: Product;
  selectedSize: Size;
  quantity: number;
}

// Interface untuk Riwayat Pesanan / Checkout
export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  totalAmount: number;
}

// --- Data Produk Pakaian ---
const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Kemeja Linen Casual',
    price: 189000,
    category: 'Pria',
    sizes: ['M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500',
  },
  {
    id: 2,
    name: 'Kaos Polos Cotton Combed 30s',
    price: 75000,
    category: 'Unisex',
    sizes: ['S', 'M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500',
  },
  {
    id: 3,
    name: 'Dress Casual Summer Floral',
    price: 245000,
    category: 'Wanita',
    sizes: ['S', 'M', 'L'],
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500',
  },
  {
    id: 4,
    name: 'Jaket Denim Oversize',
    price: 320000,
    category: 'Unisex',
    sizes: ['M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500',
  },
  {
    id: 5,
    name: 'Blouse Wanita Elegant',
    price: 165000,
    category: 'Wanita',
    sizes: ['S', 'M', 'L'],
    image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=500',
  },
  {
    id: 6,
    name: 'Celana Chino Slim Fit',
    price: 210000,
    category: 'Pria',
    sizes: ['S', 'M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500',
  },
];

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('Semua');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]); // State untuk simpan pesanan yang sudah checkout
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState<boolean>(false); // Modal Riwayat Checkout
  const [selectedSizes, setSelectedSizes] = useState<{ [key: number]: Size }>({});

  // Pilih Ukuran untuk Produk Tertentu
  const handleSizeSelect = (productId: number, size: Size) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  // Tambah ke Keranjang
  const handleAddToCart = (product: Product) => {
    const size = selectedSizes[product.id] || product.sizes[0];

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.product.id === product.id && item.selectedSize === size
      );

      if (existingIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingIndex].quantity += 1;
        return updatedCart;
      }

      return [...prevCart, { product, selectedSize: size, quantity: 1 }];
    });
  };

  // Ubah Jumlah Item di Keranjang
  const handleUpdateQuantity = (productId: number, size: Size, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product.id === productId && item.selectedSize === size) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  // Hapus Satu Item Spesifik dari Keranjang
  const handleRemoveFromCart = (productId: number, size: Size) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) => !(item.product.id === productId && item.selectedSize === size)
      )
    );
  };

  // Hapus Satu Pesanan Spesifik dari Riwayat
  const handleDeleteOrder = (orderId: string) => {
    setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId));
  };

  // Hapus Semua Riwayat Pesanan
  const handleClearAllOrders = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus seluruh riwayat pesanan?')) {
      setOrders([]);
    }
  };

  // Fungsi Proses Checkout
  const handleCheckout = () => {
    if (cart.length === 0) return;

    const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    const newOrder: Order = {
      id: `INV-${Date.now()}`,
      date: new Date().toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      items: [...cart],
      totalAmount: total,
    };

    setOrders((prevOrders) => [newOrder, ...prevOrders]); // Simpan ke riwayat pesanan
    setCart([]); // Kosongkan keranjang
    setIsCartOpen(false); // Tutup drawer keranjang
    setIsOrdersOpen(true); // Otomatis buka riwayat pesanan
  };

  // Filter Produk berdasarkan Kategori
  const filteredProducts =
    selectedCategory === 'Semua'
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === selectedCategory);

  // Hitung Total Item & Harga Keranjang
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#f8f9fa', minHeight: '100vh', color: '#333' }}>
      
      {/* --- NAVBAR --- */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        backgroundColor: '#111',
        color: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 'bold', letterSpacing: '1px' }}>
          CLOTHING STORE.
        </h1>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          {/* Tombol Lihat Barang yang Sudah Checkout */}
          <button
            onClick={() => setIsOrdersOpen(true)}
            style={{
              backgroundColor: '#333',
              color: '#fff',
              border: '1px solid #555',
              padding: '0.6rem 1.2rem',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9rem'
            }}
          >
            📋 Pesanan Saya ({orders.length})
          </button>

          {/* Tombol Keranjang */}
          <button
            onClick={() => setIsCartOpen(true)}
            style={{
              backgroundColor: '#e63946',
              color: '#fff',
              border: 'none',
              padding: '0.6rem 1.2rem',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9rem'
            }}
          >
            🛒 Keranjang ({totalItems})
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        
        {/* --- FILTER KATEGORI --- */}
        <section style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Katalog Pakaian Terbaru</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(['Semua', 'Pria', 'Wanita', 'Unisex'] as Category[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.5rem 1.2rem',
                  borderRadius: '20px',
                  border: '1px solid #111',
                  backgroundColor: selectedCategory === cat ? '#111' : '#fff',
                  color: selectedCategory === cat ? '#fff' : '#111',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* --- GRID PRODUK --- */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '2rem',
        }}>
          {filteredProducts.map((product) => {
            const currentSize = selectedSizes[product.id] || product.sizes[0];

            return (
              <div
                key={product.id}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{ width: '100%', height: '280px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#888', fontWeight: 'bold' }}>
                      {product.category}
                    </span>
                    <h3 style={{ fontSize: '1.1rem', margin: '0.3rem 0', fontWeight: '600' }}>
                      {product.name}
                    </h3>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#e63946', margin: '0.5rem 0' }}>
                      Rp {product.price.toLocaleString('id-ID')}
                    </p>

                    {/* Pilih Ukuran */}
                    <div style={{ marginTop: '0.8rem' }}>
                      <label style={{ fontSize: '0.8rem', color: '#555', display: 'block', marginBottom: '0.3rem' }}>
                        Pilih Ukuran:
                      </label>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {product.sizes.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleSizeSelect(product.id, s)}
                            style={{
                              padding: '0.2rem 0.6rem',
                              fontSize: '0.8rem',
                              border: currentSize === s ? '2px solid #111' : '1px solid #ccc',
                              backgroundColor: currentSize === s ? '#111' : '#fff',
                              color: currentSize === s ? '#fff' : '#333',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '0 1rem 1rem 1rem' }}>
                  <button
                    onClick={() => handleAddToCart(product)}
                    style={{
                      width: '100%',
                      padding: '0.7rem',
                      backgroundColor: '#111',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    + Tambah ke Keranjang
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* --- MODAL KERANJANG (CART DRAWER) --- */}
      {isCartOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 1000
        }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: '#fff',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-4px 0 15px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              padding: '1.2rem',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0 }}>Keranjang Belanja</h3>
              <button
                onClick={() => setIsCartOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              {cart.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#888', marginTop: '2rem' }}>
                  Keranjang belanja masih kosong.
                </p>
              ) : (
                cart.map((item, index) => (
                  <div
                    key={`${item.product.id}-${item.selectedSize}-${index}`}
                    style={{
                      display: 'flex',
                      gap: '0.8rem',
                      marginBottom: '1rem',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid #f0f0f0',
                      alignItems: 'center'
                    }}
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{item.product.name}</h4>
                      <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: '#666' }}>
                        Ukuran: <strong>{item.selectedSize}</strong>
                      </p>
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem', color: '#e63946' }}>
                        Rp {item.product.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, item.selectedSize, -1)}
                        style={{ width: '25px', height: '25px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }}
                      >
                        -
                      </button>
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, item.selectedSize, 1)}
                        style={{ width: '25px', height: '25px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>

                    {/* Tombol Hapus Item dari Keranjang */}
                    <button
                      onClick={() => handleRemoveFromCart(item.product.id, item.selectedSize)}
                      title="Hapus barang"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#e63946',
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        padding: '0.3rem',
                        marginLeft: '0.2rem'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div style={{ padding: '1.2rem', borderTop: '1px solid #eee', backgroundColor: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: '600' }}>Total Pembayaran:</span>
                  <span style={{ fontWeight: 'bold', color: '#e63946', fontSize: '1.2rem' }}>
                    Rp {totalPrice.toLocaleString('id-ID')}
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    backgroundColor: '#27ae60',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  Checkout Sekarang
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL RIWAYAT CHECKOUT (PESANAN SAYA) --- */}
      {isOrdersOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '650px',
            backgroundColor: '#fff',
            maxHeight: '85vh',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
          }}>
            {/* Header Modal */}
            <div style={{
              padding: '1.2rem',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#111',
              color: '#fff'
            }}>
              <h3 style={{ margin: 0 }}>📋 Barang yang Sudah Di-Checkout</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                {orders.length > 0 && (
                  <button
                    onClick={handleClearAllOrders}
                    style={{
                      backgroundColor: '#e63946',
                      color: '#fff',
                      border: 'none',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Hapus Semua
                  </button>
                )}
                <button
                  onClick={() => setIsOrdersOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* List Riwayat Pesanan */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem' }}>
              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#777' }}>
                  <p style={{ fontSize: '1.1rem', margin: 0 }}>Belum ada transaksi yang di-checkout.</p>
                  <p style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '0.5rem' }}>
                    Tambahkan pakaian ke keranjang lalu selesaikan pembayaran.
                  </p>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '1.2rem',
                      backgroundColor: '#fff'
                    }}
                  >
                    {/* Header Transaksi */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid #f0f0f0',
                      paddingBottom: '0.6rem',
                      marginBottom: '0.8rem',
                      fontSize: '0.85rem',
                      color: '#666'
                    }}>
                      <div>
                        <span>No. Pesanan: <strong>{order.id}</strong></span>
                        <span style={{ marginLeft: '1rem' }}>{order.date}</span>
                      </div>
                      
                      {/* Tombol Hapus Pesanan Spesifik */}
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        title="Hapus transaksi ini"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#e63946',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ Hapus Pesanan
                      </button>
                    </div>

                    {/* Daftar Item Pakaian */}
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          marginBottom: '0.6rem'
                        }}
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <h5 style={{ margin: 0, fontSize: '0.95rem' }}>{item.product.name}</h5>
                          <span style={{ fontSize: '0.8rem', color: '#666' }}>
                            Ukuran: <strong>{item.selectedSize}</strong> | Qty: {item.quantity}x
                          </span>
                        </div>
                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                          Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}

                    {/* Total Pembayaran per Pesanan */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '0.8rem',
                      paddingTop: '0.8rem',
                      borderTop: '1px dashed #ddd'
                    }}>
                      <span style={{ fontSize: '0.9rem', color: '#27ae60', fontWeight: 'bold' }}>
                        ✓ Status: Berhasil Di-checkout
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.85rem', color: '#666' }}>Total: </span>
                        <span style={{ fontWeight: 'bold', color: '#e63946', fontSize: '1.1rem' }}>
                          Rp {order.totalAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}