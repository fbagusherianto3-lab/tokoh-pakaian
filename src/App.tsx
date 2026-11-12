import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  loadStoreData,
  saveStoreData,
  type LocalStoreData,
} from "./data/localStore.ts";
import {
  CATEGORIES,
  DEFAULT_PRODUCT_IMAGE,
  PRODUCTS,
} from "./data/products.ts";
import { Navbar } from "./components/Navbar.tsx";
import { ProductCard } from "./components/ProductCard.tsx";
import { SalesReportsModal } from "./components/SalesReportsModal.tsx";
import type {
  CartItem,
  Category,
  OrderItem,
  OrderStatus,
  Product,
  ProductCategory,
} from "./types/product.ts";

// =====================================================
// TYPES & INTERFACES
// =====================================================

type UserRole = "Admin" | "Kasir" | "Pelanggan";

interface User {
  username: string;
  password: string;
  role: UserRole;
  name: string;
}

interface CurrentUser {
  username: string;
  role: UserRole;
  name: string;
}

// =====================================================
// MOCK USER
// =====================================================

const USERS: User[] = [
  {
    username: "admin",
    password: "123",
    role: "Admin",
    name: "Administrator",
  },
  {
    username: "kasir",
    password: "123",
    role: "Kasir",
    name: "Kasir Utama",
  },
  {
    username: "bagus",
    password: "123",
    role: "Pelanggan",
    name: "Bagus Setiawan",
  },
];

// =====================================================
// HELPER
// =====================================================

const formatRupiah = (value: number) =>
  `Rp ${value.toLocaleString("id-ID")}`;

const createOrderId = (existingIds: ReadonlySet<string>) => {
  const baseId = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let orderId = baseId;
  let suffix = 1;

  while (existingIds.has(orderId)) {
    orderId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return orderId;
};

const parseProductSizes = (value: string) => {
  const seen = new Set<string>();

  return value
    .split(",")
    .map((size) => size.trim())
    .filter((size) => {
      const normalizedSize = size.toLocaleLowerCase();
      if (!size || seen.has(normalizedSize)) return false;
      seen.add(normalizedSize);
      return true;
    });
};

const INITIAL_PRODUCTS = PRODUCTS;
const LEGACY_REMOTE_PRODUCT_IMAGES = new Set([
  "https://parto.id/asset/foto_produk/WhatsApp_Image_2022-12-13_at_20_26_26.jpeg",
  "https://th.bing.com/th/id/OIP.nTF3YjJmIYhs8PXn1zIf5QHaHa?w=201&h=200&c=7&r=0&o=7&dpr=1.1&pid=1.7&rm=3",
]);
const STORE_WHATSAPP_NUMBER = (
  import.meta.env.VITE_STORE_WHATSAPP_NUMBER ?? ""
).replace(/\D/g, "");
const STORE_BANK_NAME = import.meta.env.VITE_STORE_BANK_NAME?.trim() ?? "";
const STORE_ACCOUNT_NUMBER =
  import.meta.env.VITE_STORE_ACCOUNT_NUMBER?.trim() ?? "";
const STORE_ACCOUNT_HOLDER =
  import.meta.env.VITE_STORE_ACCOUNT_HOLDER?.trim() ?? "";
const hasStoreBankAccount =
  Boolean(STORE_BANK_NAME && STORE_ACCOUNT_NUMBER && STORE_ACCOUNT_HOLDER);

// =====================================================
// MAIN APP
// =====================================================

export default function App() {
  // ===================================================
  // LOGIN
  // ===================================================

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);
    

  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  const [users, setUsers] = useState<User[]>(USERS);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  // ===================================================
  // PRODUCT & CART
  // ===================================================

  const [productList, setProductList] =
    useState<Product[]>(INITIAL_PRODUCTS);

  const [cart, setCart] = useState<CartItem[]>([]);

  const [selectedSizes, setSelectedSizes] =
    useState<Record<number, string>>({});

  const [selectedCategory, setSelectedCategory] =
    useState<Category>("Semua");

  const [search, setSearch] = useState("");

  // ===================================================
  // STOCK LIST
  // ===================================================

  const [hiddenStockListIds, setHiddenStockListIds] =
    useState<number[]>([]);

  // ===================================================
  // ORDERS
  // ===================================================

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [databaseReady, setDatabaseReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void loadStoreData<Product, OrderItem, User>(INITIAL_PRODUCTS, USERS)
      .then((storedData: LocalStoreData<Product, OrderItem, User>) => {
        if (!isMounted) return;
        setProductList(
          storedData.products.map((product) => ({
            ...product,
            image:
              !product.image ||
              product.image === DEFAULT_PRODUCT_IMAGE ||
              LEGACY_REMOTE_PRODUCT_IMAGES.has(product.image)
                ? INITIAL_PRODUCTS.find(
                    (initialProduct) => initialProduct.id === product.id,
                  )?.image ?? DEFAULT_PRODUCT_IMAGE
                : product.image,
          })),
        );
        setOrders(storedData.orders);
        setHiddenStockListIds(storedData.hiddenStockListIds);
        setUsers(storedData.users);
        setDatabaseReady(true);
      })
      .catch((error: unknown) => {
        console.error("Gagal membaca penyimpanan lokal:", error);
        if (isMounted) setDatabaseReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!databaseReady) return;

    void saveStoreData(productList, orders, hiddenStockListIds, users).catch(
      (error: unknown) => {
        console.error("Gagal menyimpan data lokal:", error);
      },
    );
  }, [databaseReady, productList, orders, hiddenStockListIds, users]);

  const [paymentMethod, setPaymentMethod] =
    useState("QRIS / e-Wallet");
  const [payLaterTenor, setPayLaterTenor] = useState(3);
  const checkoutInProgress = useRef(false);

  useEffect(() => {
    if (cart.length === 0) {
      checkoutInProgress.current = false;
    }
  }, [cart.length]);

  const [editingOrderId, setEditingOrderId] =
    useState<string | null>(null);

  // ===================================================
  // MODAL / DRAWER
  // ===================================================

  const [isAddProductOpen, setIsAddProductOpen] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [isCartOpen, setIsCartOpen] =
    useState(false);

  const [isOrdersOpen, setIsOrdersOpen] =
    useState(false);

  const [isSalesReportsOpen, setIsSalesReportsOpen] =
    useState(false);

  // ===================================================
  // ADD PRODUCT FORM
  // ===================================================

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "Pria" as ProductCategory,
    sizes: "S, M, L, XL",
    image: "",
    stock: "20",
  });

  // ===================================================
  // EDIT PRODUCT FORM
  // ===================================================

  const [editProductForm, setEditProductForm] = useState({
    id: 0,
    name: "",
    price: "",
    category: "Pria" as ProductCategory,
    sizes: "",
    image: "",
    stock: "",
  });

  // ===================================================
  // TOAST
  // ===================================================

  const [toastMessage, setToastMessage] =
    useState<string | null>(null);
  const toastTimeout = useRef<number | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);

    if (toastTimeout.current !== null) {
      window.clearTimeout(toastTimeout.current);
    }

    toastTimeout.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimeout.current = null;
    }, 3000);
  };

  useEffect(
    () => () => {
      if (toastTimeout.current !== null) {
        window.clearTimeout(toastTimeout.current);
      }
    },
    [],
  );

  const canManageStore =
    currentUser?.role === "Admin" || currentUser?.role === "Kasir";

  const requireStoreManager = () => {
    if (canManageStore) return true;
    showToast("Fitur ini hanya tersedia untuk Admin atau Kasir.");
    return false;
  };

  // ===================================================
  // FILTER PRODUCT
  // ===================================================

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return productList.filter((product) => {
      const matchCategory =
        selectedCategory === "Semua" ||
        product.category === selectedCategory;

      const matchSearch =
        keyword === "" ||
        product.name.toLowerCase().includes(keyword);

      return matchCategory && matchSearch;
    });
  }, [productList, selectedCategory, search]);

  // ===================================================
  // TOTAL
  // ===================================================

  const totalCartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const totalCartPrice = cart.reduce(
    (total, item) =>
      total + item.product.price * item.quantity,
    0
  );

  const totalProductStock = productList.reduce(
    (total, product) => total + product.stock,
    0
  );

  const totalProductTypes = productList.length;

  const visibleOrders = useMemo(
    () =>
      currentUser?.role === "Pelanggan"
        ? orders.filter(
            (order) => order.username === currentUser.username,
          )
        : orders,
    [currentUser, orders],
  );

  const visibleStockProducts = productList.filter(
    (product) => !hiddenStockListIds.includes(product.id)
  );

  // ===================================================
  // LOGIN
  // ===================================================

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();

    setLoginError("");

    const username =
      loginForm.username.trim().toLowerCase();

    const user = users.find(
      (item) =>
        item.username.toLowerCase() === username &&
        item.password === loginForm.password
    );

    if (!user) {
      setLoginError("Username atau password salah.");
      return;
    }

    setCurrentUser({
      username: user.username,
      role: user.role,
      name: user.name,
    });

    setLoginForm({
      username: "",
      password: "",
    });

    setShowPassword(false);
  };

  const handleRegister = (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError("");

    const name = registerForm.name.trim();
    const username = registerForm.username.trim().toLowerCase();

    if (!name) {
      setLoginError("Nama lengkap wajib diisi.");
      return;
    }

    if (!/^[a-z0-9._-]{3,24}$/.test(username)) {
      setLoginError(
        "Username harus 3–24 karakter dan hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda hubung.",
      );
      return;
    }

    if (users.some((user) => user.username.toLowerCase() === username)) {
      setLoginError("Username sudah digunakan. Silakan pilih username lain.");
      return;
    }

    if (registerForm.password.length < 6) {
      setLoginError("Password harus terdiri dari minimal 6 karakter.");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setLoginError("Konfirmasi password tidak cocok.");
      return;
    }

    const newUser: User = {
      username,
      password: registerForm.password,
      role: "Pelanggan",
      name,
    };

    setUsers((previousUsers) => [...previousUsers, newUser]);
    setCurrentUser({
      username: newUser.username,
      role: newUser.role,
      name: newUser.name,
    });
    setRegisterForm({
      name: "",
      username: "",
      password: "",
      confirmPassword: "",
    });
  };

  const handleQuickLogin = (role: UserRole) => {
    const user = users.find(
      (item) => item.role === role
    );

    if (!user) return;

    setCurrentUser({
      username: user.username,
      role: user.role,
      name: user.name,
    });

    setLoginError("");
  };

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = () => {
    setCurrentUser(null);
    setCart([]);
    setSelectedSizes({});
    setIsCartOpen(false);
    setIsOrdersOpen(false);
    setIsSalesReportsOpen(false);
    setIsAddProductOpen(false);
    setEditingProduct(null);
    setEditingOrderId(null);
    setSearch("");
    setSelectedCategory("Semua");
  };

  const handleSwitchAccount = (registering: boolean) => {
    handleLogout();
    setIsRegistering(registering);
    setLoginError("");
  };

  // ===================================================
  // SIZE
  // ===================================================

  const selectSize = (
    productId: number,
    size: string
  ) => {
    setSelectedSizes((previous) => ({
      ...previous,
      [productId]: size,
    }));
  };

  // ===================================================
  // ADD TO CART
  // ===================================================

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      showToast("Stok pakaian ini sedang habis!");
      return;
    }

    const selectedSize = selectedSizes[product.id];

    if (!selectedSize) {
      showToast(
        `Pilih ukuran untuk ${product.name} terlebih dahulu!`
      );
      return;
    }

    setCart((previousCart) => {
      const productQuantityInCart = previousCart
        .filter((item) => item.product.id === product.id)
        .reduce((total, item) => total + item.quantity, 0);

      if (productQuantityInCart >= product.stock) {
        showToast(
          "Jumlah di keranjang sudah mencapai stok.",
        );
        return previousCart;
      }

      const existingIndex = previousCart.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedSize === selectedSize
      );

      if (existingIndex !== -1) {
        const updatedCart = [...previousCart];

        const existingItem =
          updatedCart[existingIndex];

        updatedCart[existingIndex] = {
          ...existingItem,
          product: { ...product },
          quantity: existingItem.quantity + 1,
        };

        return updatedCart;
      }

      return [
        ...previousCart,
        {
          product: { ...product },
          selectedSize,
          quantity: 1,
        },
      ];
    });
  };

  // ===================================================
  // UPDATE CART QTY
  // ===================================================

  const updateCartQty = (
    productId: number,
    size: string,
    delta: number
  ) => {
    setCart((previousCart) =>
      previousCart
        .map((item) => {
          if (
            item.product.id !== productId ||
            item.selectedSize !== size
          ) {
            return item;
          }

          const latestProduct = productList.find(
            (product) => product.id === productId
          );

          const latestStock =
            latestProduct?.stock ??
            item.product.stock;
          const productQuantityInCart = previousCart
            .filter(
              (cartItem) =>
                cartItem.product.id === productId,
            )
            .reduce(
              (total, cartItem) => total + cartItem.quantity,
              0,
            );

          if (
            delta > 0 &&
            productQuantityInCart >= latestStock
          ) {
            showToast(
              "Jumlah melebihi stok yang tersedia."
            );

            return item;
          }

          const nextQuantity = Math.min(
            latestStock,
            item.quantity + delta
          );

          if (nextQuantity <= 0) {
            return null;
          }

          return {
            ...item,
            product: latestProduct
              ? { ...latestProduct }
              : item.product,
            quantity: nextQuantity,
          };
        })
        .filter(
          (item): item is CartItem => item !== null
        )
    );
  };

  // ===================================================
  // REMOVE CART ITEM
  // ===================================================

  const removeCartItem = (
    productId: number,
    size: string
  ) => {
    setCart((previousCart) =>
      previousCart.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.selectedSize === size
          )
      )
    );

    showToast("Item dihapus dari keranjang!");
  };

  // ===================================================
  // CHECKOUT
  // ===================================================

  const handleCheckout = () => {
    if (checkoutInProgress.current) return;

    if (!currentUser) {
      showToast("Silakan login terlebih dahulu.");
      return;
    }

    if (cart.length === 0) {
      showToast("Keranjang masih kosong.");
      return;
    }

    const quantitiesByProduct = new Map<number, number>();
    for (const item of cart) {
      quantitiesByProduct.set(
        item.product.id,
        (quantitiesByProduct.get(item.product.id) ?? 0) + item.quantity,
      );
    }

    // Cek stok terbaru dan total kuantitas semua ukuran per produk.
    for (const item of cart) {
      const latestProduct = productList.find(
        (product) => product.id === item.product.id
      );

      if (!latestProduct) {
        showToast(
          `Produk ${item.product.name} sudah tidak tersedia.`
        );
        return;
      }

      if (
        !latestProduct.sizes.includes(
          item.selectedSize
        )
      ) {
        showToast(
          `Ukuran ${item.selectedSize} untuk ${item.product.name} sudah tidak tersedia.`
        );
        return;
      }
    }

    for (const [productId, quantity] of quantitiesByProduct) {
      const product = productList.find(
        (item) => item.id === productId,
      );
      if (product && product.stock < quantity) {
        showToast(`Stok ${product.name} tidak mencukupi.`);
        return;
      }
    }

    if (
      paymentMethod === "Checkout WhatsApp" &&
      !/^\d{9,15}$/.test(STORE_WHATSAPP_NUMBER)
    ) {
      showToast(
        "Nomor WhatsApp toko belum dikonfigurasi. Atur VITE_STORE_WHATSAPP_NUMBER di file .env.local.",
      );
      return;
    }

    checkoutInProgress.current = true;

    const orderId = createOrderId(
      new Set(orders.map((order) => order.id)),
    );

    if (paymentMethod === "Checkout WhatsApp") {
      const message = [
        "Halo Toko Pakaian Bagus & Tasya, saya ingin memesan:",
        `Nama: ${currentUser.name}`,
        `Nomor pesanan: ${orderId}`,
        ...cart.map(
          (item) =>
            `- ${item.product.name} (ukuran ${item.selectedSize}) x${item.quantity} = ${formatRupiah(item.product.price * item.quantity)}`,
        ),
        `Total: ${formatRupiah(totalCartPrice)}`,
        "Mohon konfirmasi ketersediaan dan cara pembayaran. Terima kasih.",
      ].join("\n");
      const whatsappWindow = window.open(
        `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
        "_blank",
      );

      if (!whatsappWindow) {
        checkoutInProgress.current = false;
        showToast("WhatsApp tidak dapat dibuka. Izinkan pop-up lalu coba lagi.");
        return;
      }

      whatsappWindow.opener = null;
    }

    const orderCreatedAt = new Date();

    const newOrder: OrderItem = {
      id: orderId,

      date: orderCreatedAt.toLocaleString(
        "id-ID",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      ),
      createdAt: orderCreatedAt.toISOString(),

      username: currentUser.username,

      items: cart.map((item) => ({
        ...item,
        product: { ...item.product },
      })),

      totalPrice: totalCartPrice,

      paymentMethod:
        paymentMethod === "PayLater"
          ? `PayLater (simulasi, ${payLaterTenor} bulan)`
          : paymentMethod,

      status: "Diproses",
    };

    // Kurangi stok
    setProductList((previousProducts) =>
      previousProducts.map((product) => {
        const quantity = quantitiesByProduct.get(product.id);
        if (quantity === undefined) {
          return product;
        }

        return {
          ...product,
          stock: Math.max(
            0,
            product.stock - quantity
          ),
        };
      })
    );

    setOrders((previousOrders) => [
      newOrder,
      ...previousOrders,
    ]);

    setCart([]);
    setSelectedSizes({});
    setIsCartOpen(false);
    setIsOrdersOpen(true);

    showToast(
      paymentMethod === "Checkout WhatsApp"
        ? "Pesanan disiapkan. Periksa dan kirim pesan melalui WhatsApp."
        : "Pesanan berhasil dibuat!",
    );
  };

  // ===================================================
  // ORDER HANDLERS
  // ===================================================

  const handleDeleteOrder = (
    orderId: string
  ) => {
    if (!requireStoreManager()) return;

    setOrders((previousOrders) =>
      previousOrders.filter(
        (order) => order.id !== orderId
      )
    );

    if (editingOrderId === orderId) {
      setEditingOrderId(null);
    }

    showToast(
      `Pesanan ${orderId} berhasil dihapus.`
    );
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    status: OrderStatus
  ) => {
    if (!requireStoreManager()) return;

    setOrders((previousOrders) =>
      previousOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status,
            }
          : order
      )
    );

    setEditingOrderId(null);

    showToast(
      `Status ${orderId} diperbarui menjadi "${status}".`
    );
  };

  // ===================================================
  // HIDE STOCK LIST
  // ===================================================

  const hideFromStockList = (
    productId: number
  ) => {
    if (!requireStoreManager()) return;

    setHiddenStockListIds((previousIds) =>
      previousIds.includes(productId)
        ? previousIds
        : [...previousIds, productId]
    );
  };

  // ===================================================
  // RESTORE STOCK LIST
  // ===================================================

  const restoreStockList = () => {
    if (!requireStoreManager()) return;

    setHiddenStockListIds([]);
    showToast(
      "Semua produk ditampilkan kembali pada daftar stok."
    );
  };

  // ===================================================
  // ADD STOCK
  // ===================================================

  const handleAddStock = (
    productId: number
  ) => {
    if (!requireStoreManager()) return;

    setProductList((previousProducts) =>
      previousProducts.map((product) =>
        product.id === productId
          ? {
              ...product,
              stock: product.stock + 5,
            }
          : product
      )
    );

    showToast("+5 stok berhasil ditambahkan!");
  };

  // ===================================================
  // DELETE PRODUCT
  // ===================================================

  const handleDeleteProduct = (
    productId: number
  ) => {
    if (!requireStoreManager()) return;

    const product = productList.find(
      (item) => item.id === productId
    );

    if (!product) return;

    const confirmed = window.confirm(
      `Hapus produk "${product.name}" dari katalog?`
    );

    if (!confirmed) return;

    setProductList((previousProducts) =>
      previousProducts.filter(
        (item) => item.id !== productId
      )
    );

    setCart((previousCart) =>
      previousCart.filter(
        (item) => item.product.id !== productId
      )
    );

    setSelectedSizes((previousSizes) => {
      const updated = {
        ...previousSizes,
      };

      delete updated[productId];

      return updated;
    });

    setHiddenStockListIds((previousIds) =>
      previousIds.filter(
        (id) => id !== productId
      )
    );

    if (editingProduct?.id === productId) {
      setEditingProduct(null);
    }

    showToast("Produk berhasil dihapus dari katalog!");
  };

  // ===================================================
  // ADD PRODUCT
  // ===================================================

  const handleAddProductSubmit = (
    event: React.FormEvent
  ) => {
    event.preventDefault();
    if (!requireStoreManager()) return;

    const name = newProduct.name.trim();
    const price = Number(newProduct.price);
    const stock = Number(newProduct.stock);

    const sizes = parseProductSizes(newProduct.sizes);

    if (!name) {
      showToast("Nama produk wajib diisi!");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      showToast("Harga produk tidak valid!");
      return;
    }

    if (
      !newProduct.stock.trim() ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      showToast("Jumlah stok tidak valid!");
      return;
    }

    if (sizes.length === 0) {
      showToast("Minimal masukkan satu ukuran!");
      return;
    }

    const image = newProduct.image.trim();

    const createdProduct: Omit<Product, "id"> = {
      name,
      price,
      category: newProduct.category,
      sizes,
      image: image || DEFAULT_PRODUCT_IMAGE,
      stock,
    };

    setProductList((previousProducts) => [
      {
        ...createdProduct,
        id:
          previousProducts.reduce(
            (highestId, product) => Math.max(highestId, product.id),
            0,
          ) + 1,
      },
      ...previousProducts,
    ]);

    setIsAddProductOpen(false);

    setNewProduct({
      name: "",
      price: "",
      category: "Pria",
      sizes: "S, M, L, XL",
      image: "",
      stock: "20",
    });

    showToast(
      "🎉 Produk pakaian baru berhasil ditambahkan!"
    );
  };

  // ===================================================
  // OPEN EDIT PRODUCT
  // ===================================================

  const openEditProductModal = (
    product: Product
  ) => {
    if (!requireStoreManager()) return;

    setEditingProduct(product);

    setEditProductForm({
      id: product.id,
      name: product.name,
      price: String(product.price),
      category: product.category,
      sizes: product.sizes.join(", "),
      image:
        product.image.startsWith("http://") ||
        product.image.startsWith("https://")
          ? product.image
          : "",
      stock: String(product.stock),
    });
  };

  // ===================================================
  // EDIT PRODUCT
  // ===================================================

  const handleEditProductSubmit = (
    event: React.FormEvent
  ) => {
    event.preventDefault();
    if (!requireStoreManager()) return;

    const name =
      editProductForm.name.trim();

    const price =
      Number(editProductForm.price);

    const stock =
      Number(editProductForm.stock);

    const sizes = parseProductSizes(editProductForm.sizes);

    if (!name) {
      showToast("Nama produk wajib diisi!");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      showToast("Harga produk tidak valid!");
      return;
    }

    if (
      !editProductForm.stock.trim() ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      showToast("Jumlah stok tidak valid!");
      return;
    }

    if (sizes.length === 0) {
      showToast("Minimal masukkan satu ukuran!");
      return;
    }

    const image = editProductForm.image.trim();

    setProductList((previousProducts) =>
      previousProducts.map((product) => {
        if (
          product.id !==
          editProductForm.id
        ) {
          return product;
        }

        return {
          ...product,
          name,
          price,
          category:
            editProductForm.category,
          sizes,
          image: image || product.image,
          stock,
        };
      })
    );

    // Sinkronisasi item keranjang
    setCart((previousCart) => {
      let remainingStock = stock;

      return previousCart.flatMap((item) => {
        if (item.product.id !== editProductForm.id) {
          return [item];
        }

        if (!sizes.includes(item.selectedSize) || remainingStock <= 0) {
          return [];
        }

        const quantity = Math.min(item.quantity, remainingStock);
        remainingStock -= quantity;

        if (quantity <= 0) return [];

        return [{
          ...item,
          product: {
            ...item.product,
            name,
            price,
            category: editProductForm.category,
            sizes,
            image:
              editProductForm.image.trim() ||
              item.product.image,
            stock,
          },
          quantity,
        }];
      });
    });

    setEditingProduct(null);

    showToast(
      "✏️ Produk berhasil diperbarui!"
    );
  };

  // ===================================================
  // DATABASE LOADING
  // ===================================================

  if (!databaseReady) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        Memuat database lokal...
      </div>
    );
  }

  // ===================================================
  // LOGIN PAGE
  // ===================================================

  if (!currentUser) {
    return (
      <div className="login-wrapper">
        <style>{`
          * {
            box-sizing: border-box;
            font-family:
              system-ui,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
          }

          body {
            margin: 0;
          }

          .login-wrapper {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background:
              radial-gradient(
                circle at 15% 10%,
                rgba(139, 92, 246, .28),
                transparent 34%
              ),
              radial-gradient(
                circle at 90% 90%,
                rgba(192, 132, 252, .16),
                transparent 32%
              ),
              #100d16;
            padding: 20px;
            color: #f8fafc;
          }

          .login-box {
            width: 100%;
            max-width: 940px;
            background: #1b1721;
            border-radius: 28px;
            overflow: hidden;
            display: grid;
            grid-template-columns: 1fr 1fr;
            border: 1px solid rgba(255,255,255,.1);
            box-shadow:
              0 32px 90px rgba(0,0,0,.48);
          }

          .login-hero {
            background:
              linear-gradient(
                145deg,
                #7c3aed,
                #4c1d75 70%,
                #291936
              );
            padding: 48px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 540px;
            position: relative;
            isolation: isolate;
          }

          .login-hero::after {
            content: "";
            position: absolute;
            width: 280px;
            height: 280px;
            right: -95px;
            bottom: -110px;
            border: 1px solid rgba(255,255,255,.18);
            border-radius: 50%;
            box-shadow:
              0 0 0 28px rgba(255,255,255,.04),
              0 0 0 58px rgba(255,255,255,.035);
            z-index: -1;
          }

          .login-form {
            padding: 48px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .form-group {
            margin-bottom: 18px;
          }

          .form-group label {
            display: block;
            font-size: 13px;
            margin-bottom: 8px;
            color: #e9e2f2;
            font-weight: 700;
          }

          .input-field {
            width: 100%;
            height: 50px;
            background: #120f17;
            border: 1px solid #3d3348;
            border-radius: 12px;
            padding: 0 14px;
            color: #fff;
            outline: none;
            transition: border-color .2s ease, box-shadow .2s ease;
          }

          .input-field:focus {
            border-color: #a78bfa;
            box-shadow:
              0 0 0 3px
              rgba(167,139,250,.16);
          }

          .btn-primary {
            width: 100%;
            height: 50px;
            background: linear-gradient(115deg, #8b5cf6, #6d28d9);
            color: #fff;
            font-weight: 700;
            border: 0;
            border-radius: 12px;
            cursor: pointer;
            box-shadow: 0 10px 24px rgba(109,40,217,.25);
          }

          .btn-primary:hover {
            background: linear-gradient(115deg, #9b70fa, #7c3aed);
          }

          .quick-btns {
            display: flex;
            gap: 8px;
            margin-top: 16px;
          }

          .quick-btn {
            flex: 1;
            padding: 11px 9px;
            background: #28222f;
            border: 1px solid #3d3348;
            border-radius: 10px;
            color: #e9e2f2;
            font-size: 12px;
            cursor: pointer;
          }

          .quick-btn:hover {
            background: #382b47;
            color: #fff;
            border-color: #7253a1;
          }

          @media (max-width: 640px) {
            .login-box {
              grid-template-columns: 1fr;
            }

            .login-hero {
              display: none;
            }

            .login-form {
              padding: 28px 22px;
            }

            .quick-btns {
              flex-direction: column;
            }
          }
        `}</style>

        <div className="login-box">
          <div className="login-hero">
            <div>
              <div
                style={{
                  fontSize: "54px",
                  marginBottom: "18px",
                }}
              >
                👕
              </div>

              <h1
                style={{
                  fontSize: "30px",
                  margin: "0 0 12px",
                }}
              >
                tokoh baju
              </h1>

              <p
                style={{
                  lineHeight: "1.7",
                  color: "#e0e7ff",
                  margin: 0,
                }}
              >
                Platform belanja pakaian
                modern terlengkap.
              </p>
            </div>

            <div
              style={{
                fontSize: "12px",
                opacity: 0.8,
              }}
            >
              Demo password:
              <b> 123</b>
            </div>
          </div>

          <div className="login-form">
            <h2
              style={{
                margin: "0 0 8px",
              }}
            >
              {isRegistering
                ? "Buat akun pelanggan baru"
                : "Selamat Datang di tokoh pakaian kami👋"}
            </h2>

            <p
              style={{
                color: "#94a3b8",
                fontSize: "14px",
                margin:
                  "0 0 24px",
              }}
            >
              {isRegistering
                ? "Daftar untuk mulai berbelanja"
                : "Silakan masuk ke akun Anda"}
            </p>

            {loginError && (
              <div
                style={{
                  color: "#f87171",
                  background:
                    "rgba(239,68,68,.08)",
                  border:
                    "1px solid rgba(239,68,68,.2)",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  marginBottom: "14px",
                  fontSize: "13px",
                }}
              >
                ⚠️ {loginError}
              </div>
            )}

            <form
              onSubmit={isRegistering ? handleRegister : handleLogin}
            >
              {isRegistering && (
                <div className="form-group">
                  <label htmlFor="register-name">Nama lengkap</label>
                  <input
                    id="register-name"
                    className="input-field"
                    placeholder="Nama Anda"
                    autoComplete="name"
                    value={registerForm.name}
                    onChange={(event) =>
                      setRegisterForm({
                        ...registerForm,
                        name: event.target.value,
                      })
                    }
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label
                  htmlFor={
                    isRegistering
                      ? "register-username"
                      : "login-username"
                  }
                >
                  Username
                </label>

                <input
                  id={
                    isRegistering
                      ? "register-username"
                      : "login-username"
                  }
                  className="input-field"
                  placeholder={
                    isRegistering
                      ? "Buat username"
                      : "admin / kasir / bagus"
                  }
                  autoComplete="username"
                  value={
                    isRegistering
                      ? registerForm.username
                      : loginForm.username
                  }
                  onChange={(event) => {
                    if (isRegistering) {
                      setRegisterForm({
                        ...registerForm,
                        username: event.target.value,
                      });
                    } else {
                      setLoginForm({
                        ...loginForm,
                        username: event.target.value,
                      });
                    }
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label
                  htmlFor={
                    isRegistering
                      ? "register-password"
                      : "login-password"
                  }
                >
                  Password
                </label>

                <div
                  style={{
                    position:
                      "relative",
                  }}
                >
                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    id={
                      isRegistering
                        ? "register-password"
                        : "login-password"
                    }
                    className="input-field"
                    placeholder="Password"
                    autoComplete={
                      isRegistering
                        ? "new-password"
                        : "current-password"
                    }
                    minLength={isRegistering ? 6 : undefined}
                    value={
                      isRegistering
                        ? registerForm.password
                        : loginForm.password
                    }
                    onChange={(event) => {
                      if (isRegistering) {
                        setRegisterForm({
                          ...registerForm,
                          password: event.target.value,
                        });
                      } else {
                        setLoginForm({
                          ...loginForm,
                          password: event.target.value,
                        });
                      }
                    }}
                    required
                    style={{
                      paddingRight:
                        "85px",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (previous) =>
                          !previous
                      )
                    }
                    style={{
                      position:
                        "absolute",
                      right: "8px",
                      top: "6px",
                      height: "34px",
                      border: "none",
                      background:
                        "transparent",
                      color: "#94a3b8",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {showPassword
                      ? "Sembunyikan"
                      : "Lihat"}
                  </button>
                </div>
              </div>

              {isRegistering && (
                <div className="form-group">
                  <label htmlFor="register-confirm-password">
                    Konfirmasi password
                  </label>
                  <input
                    id="register-confirm-password"
                    type={showPassword ? "text" : "password"}
                    className="input-field"
                    placeholder="Ulangi password"
                    autoComplete="new-password"
                    minLength={6}
                    value={registerForm.confirmPassword}
                    onChange={(event) =>
                      setRegisterForm({
                        ...registerForm,
                        confirmPassword: event.target.value,
                      })
                    }
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
              >
                {isRegistering ? "Daftar Sekarang" : "Masuk Sekarang"}
              </button>
            </form>

            <div
              style={{
                marginTop: "18px",
                textAlign: "center",
                fontSize: "13px",
                color: "#94a3b8",
              }}
            >
              {isRegistering ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering((previous) => !previous);
                  setLoginError("");
                  setShowPassword(false);
                }}
                style={{
                  border: 0,
                  padding: 0,
                  background: "transparent",
                  color: "#c4b5fd",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {isRegistering ? "Masuk" : "Daftar"}
              </button>
            </div>

            {!isRegistering && (
              <>
                <div
                  style={{
                    marginTop: "20px",
                    color: "#64748b",
                    fontSize: "11px",
                    textAlign: "center",
                  }}
                >
                  Login cepat
                </div>

                <div className="quick-btns">
                  <button
                    type="button"
                    className="quick-btn"
                    onClick={() => handleQuickLogin("Admin")}
                  >
                    👑 Admin
                  </button>

                  <button
                    type="button"
                    className="quick-btn"
                    onClick={() => handleQuickLogin("Kasir")}
                  >
                    🏬 Kasir
                  </button>

                  <button
                    type="button"
                    className="quick-btn"
                    onClick={() => handleQuickLogin("Pelanggan")}
                  >
                    👤 Pelanggan
                  </button>
                </div>

                <div
                  style={{
                    marginTop: "16px",
                    fontSize: "11px",
                    color: "#64748b",
                    textAlign: "center",
                  }}
                >
                  Admin: admin / 123
                  <br />
                  Kasir: kasir / 123
                  <br />
                  Pelanggan: bagus / 123
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===================================================
  // MAIN PAGE
  // ===================================================

  return (
    <div className="app-container">
      <style>{`
        * {
          box-sizing: border-box;
          font-family:
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        body {
          margin: 0;
          background: #f7f5f2;
          color: #241b2d;
        }

        .app-container {
          min-height: 100vh;
          background:
            radial-gradient(ellipse at 95% 0%, rgba(124, 58, 237, .055), transparent 30%),
            #f7f5f2;
        }

        button,
        input,
        select {
          font-family: inherit;
        }

        button {
          transition:
            transform .15s ease,
            opacity .15s ease,
            background .15s ease;
        }

        button:active {
          transform: scale(.98);
        }

        button:focus-visible,
        input:focus-visible,
        select:focus-visible {
          outline: 3px solid rgba(124, 58, 237, .3);
          outline-offset: 2px;
        }

        .header-bar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: linear-gradient(105deg, #21162c, #352044 68%, #4b2860);
          color: #fff;
          padding: 15px clamp(16px, 4vw, 48px);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          box-shadow: 0 8px 28px rgba(35, 22, 44, .17);
          border-bottom: 1px solid rgba(255,255,255,.08);
        }

        .action-btn {
          background: rgba(255,255,255,.09);
          color: #fff;
          border: 1px solid rgba(255,255,255,.16);
          padding: 8px 14px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          white-space: nowrap;
        }

        .action-btn:hover {
          opacity: 1;
          background: rgba(255,255,255,.16);
          transform: translateY(-1px);
        }

        .action-btn.primary {
          background: #8b5cf6;
          border-color: #8b5cf6;
          box-shadow: 0 5px 14px rgba(139, 92, 246, .24);
        }

        .action-btn.success {
          background: #a78bfa;
          border-color: #a78bfa;
          color: #21162c;
        }

        .layout-container {
          max-width: 1360px;
          margin: 0 auto;
          padding: 34px clamp(16px, 4vw, 48px) 64px;
        }

        .catalog-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          margin-bottom: 24px;
        }

        .catalog-head h2 {
          color: #241b2d;
          font-size: clamp(25px, 3vw, 34px);
          letter-spacing: -.04em;
          font-weight: 800;
          margin-bottom: 7px !important;
        }

        .catalog-head p {
          color: #766c7d !important;
        }

        .search-input {
          padding: 12px 16px 12px 42px;
          border-radius: 12px;
          border: 1px solid #e3dce8;
          width: min(320px, 100%);
          outline: none;
          background: #fff;
          color: #241b2d;
          box-shadow: 0 4px 14px rgba(43, 29, 52, .04);
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23877b90' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: 14px center;
        }

        .search-input:focus {
          border-color: #8b5cf6;
          box-shadow:
            0 0 0 3px
            rgba(139,92,246,.12);
        }

        .stock-summary {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 24px;
        }

        .stock-summary-card {
          background: linear-gradient(135deg, #fff, #fbf9fd);
          border: 1px solid #ebe5ef;
          border-radius: 18px;
          padding: 18px 20px;
          box-shadow: 0 8px 24px rgba(43, 29, 52, .045);
        }

        .stock-summary-label {
          font-size: 12px;
          color: #807486;
          margin-bottom: 6px;
          font-weight: 600;
          letter-spacing: .02em;
        }

        .stock-summary-value {
          font-size: 28px;
          font-weight: 800;
          color: #382348;
          letter-spacing: -.04em;
        }

        .category-scroll {
          display: flex;
          gap: 9px;
          overflow-x: auto;
          padding-bottom: 8px;
          margin-bottom: 22px;
          scrollbar-width: thin;
        }

        .cat-chip {
          padding: 9px 17px;
          border-radius: 999px;
          background: #fff;
          border: 1px solid #e7e0eb;
          font-size: 13px;
          font-weight: 600;
          color: #63576d;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(43, 29, 52, .025);
        }

        .cat-chip:hover {
          border-color: #a78bfa;
          color: #6d28d9;
          transform: translateY(-1px);
        }

        .cat-chip.active {
          background: linear-gradient(115deg, #7c3aed, #5b21b6);
          color: #fff;
          border-color: #6d28d9;
          box-shadow: 0 6px 16px rgba(109, 40, 217, .2);
        }

        .product-grid {
          display: grid;
          grid-template-columns:
            repeat(
              auto-fill,
              minmax(240px, 1fr)
            );
          gap: 18px;
        }

        .product-card {
          background: #fff;
          border-radius: 18px;
          border: 1px solid #ebe5ef;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 6px 20px rgba(43, 29, 52, .045);
          transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
        }

        .product-card:hover {
          transform: translateY(-5px);
          box-shadow:
            0 18px 40px
            rgba(43,29,52,.12);
          border-color: #d6c6e6;
        }

        .product-img-wrap {
          position: relative;
          width: 100%;
          height: 240px;
          background: #f0ebf2;
          overflow: hidden;
        }

        .product-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform .45s ease;
        }

        .product-card:hover .product-img {
          transform: scale(1.045);
        }

        .size-text {
          min-width: 34px;
          min-height: 32px;
          padding: 5px 9px;
          background: #fffefa;
          border: 1px solid #e7e6dc;
          font-size: 12px;
          font-weight: 600;
          color: #486253;
          cursor: pointer;
          border-radius: 8px;
          transition: color .15s ease, background .15s ease, border-color .15s ease;
        }

        .size-text:hover {
          color: #173d30;
          border-color: #9cb09c;
          background: #f1f5ee;
        }

        .size-text.selected {
          color: #fff9ec;
          border-color: #173d30;
          background: #173d30;
          font-weight: 800;
        }

        .drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(24, 16, 31, .58);
          backdrop-filter: blur(3px);
          z-index: 300;
        }

        .drawer-content {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: min(420px, 100%);
          background: #fff;
          z-index: 301;
          padding: 26px;
          display: flex;
          flex-direction: column;
          box-shadow: -18px 0 55px rgba(25, 15, 33, .2);
        }

        .modal-box {
          position: fixed;
          top: 50%;
          left: 50%;
          transform:
            translate(-50%, -50%);
          width: min(540px, 92%);
          background: #fff;
          border-radius: 20px;
          padding: 26px;
          z-index: 301;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 28px 90px rgba(25, 15, 33, .28);
          border: 1px solid #eee8f1;
        }

        .edit-product-modal {
          background: #0b0b0b;
          color: #f5f5f5;
          border: 1px solid #303030;
        }

        .edit-product-modal h3 {
          color: #fff;
        }

        .edit-product-form label {
          display: block;
          color: #f5f5f5;
          margin-bottom: 4px;
        }

        .edit-product-form .form-input {
          box-sizing: border-box;
          display: block;
          margin-top: 0;
          margin-bottom: 14px;
          color: #111;
          background: #fff;
        }

        .add-product-modal {
          background: #0b0b0b;
          color: #fff;
          border: 1px solid #303030;
        }

        .add-product-modal h3 {
          color: #fff;
        }

        .add-product-modal .close-btn {
          color: #fff;
        }

        .add-product-form label {
          display: block;
          color: #fff;
          margin-bottom: 4px;
        }

        .add-product-form .form-input {
          box-sizing: border-box;
          display: block;
          margin-top: 0;
          margin-bottom: 14px;
          color: #fff;
          background: #1a1a1a;
          border-color: #404040;
        }

        .add-product-form .form-input::placeholder {
          color: #fff;
          opacity: 0.7;
        }

        .add-product-form option {
          color: #fff;
          background: #1a1a1a;
        }

        .form-input {
          width: 100%;
          padding: 11px 13px;
          border: 1px solid #e1d9e7;
          border-radius: 10px;
          font-size: 14px;
          margin-top: 4px;
          margin-bottom: 12px;
          outline: none;
          background: #fff;
          color: #241b2d;
          transition: border-color .18s ease, box-shadow .18s ease;
        }

        .form-input:focus {
          border-color: #8b5cf6;
          box-shadow:
            0 0 0 3px
            rgba(139,92,246,.12);
        }

        .qty-text-btn {
          background: transparent;
          border: none;
          font-size: 16px;
          font-weight: 800;
          color: #6d28d9;
          cursor: pointer;
          padding: 2px 8px;
          border-radius: 7px;
        }

        .qty-text-btn:hover {
          color: #fff;
          background: #7c3aed;
        }

        .order-btn {
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 2px 6px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 4px;
        }

        .order-btn:hover {
          background: #f1f5f9;
        }

        .close-btn {
          border: none;
          background: transparent;
          font-size: 18px;
          cursor: pointer;
          color: #71657b;
        }

        .close-btn:hover {
          color: #dc2626;
          background: #fef2f2;
          border-radius: 8px;
        }

        .toast-banner {
          position: fixed;
          top: 80px;
          right: 24px;
          z-index: 500;
          background: #291936;
          color: #fff;
          padding: 12px 20px;
          border-radius: 12px;
          border-left: 4px solid #a78bfa;
          box-shadow:
            0 10px 30px
            rgba(25,15,33,.24);
          max-width: 360px;
          font-size: 13px;
        }

        .stock-list-row {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            auto
            minmax(120px, auto);
          align-items: center;
          gap: 12px;
          padding: 11px 12px;
          border-radius: 10px;
          border: 1px solid #f0eaf3;
          background: #fbf9fc;
          transition: background .16s ease, border-color .16s ease;
        }

        .stock-list-row:hover {
          background: #f6f0fa;
          border-color: #e4d7ee;
        }

        .stock-panel {
          background: #fff;
          border: 1px solid #ebe5ef;
          border-radius: 18px;
          padding: 20px;
          margin-bottom: 26px;
          box-shadow: 0 8px 24px rgba(43, 29, 52, .04);
        }

        .product-card h4 {
          color: #2b1d34;
          line-height: 1.4;
        }

        .product-card > div:nth-child(2) > span {
          color: #7c3aed !important;
          letter-spacing: .04em;
          text-transform: uppercase;
        }

        .add-product-modal {
          background: #17131c;
          border-color: #38303f;
          color: #fff;
        }

        .add-product-modal h3 {
          color: #fff;
        }

        .add-product-form .form-input {
          color: #fff;
          background: #211b27;
          border-color: #453a4d;
        }

        .add-product-form .form-input::placeholder {
          color: #c3b8cc;
          opacity: .82;
        }

        .add-product-form option {
          color: #fff;
          background: #211b27;
        }

        .add-product-modal .action-btn {
          min-height: 42px;
          border-radius: 10px;
        }

        .add-product-modal .action-btn.success {
          color: #21162c;
          background: #c4b5fd;
          border-color: #c4b5fd;
        }

        .edit-product-modal {
          background: #17131c;
          border-color: #38303f;
        }

        .edit-product-form .form-input {
          color: #fff;
          background: #211b27;
          border-color: #453a4d;
        }

        .header-actions > .action-btn:last-child {
          background: #b54462 !important;
          border-color: #b54462 !important;
        }

        @media (max-width: 760px) {
          .header-bar {
            flex-wrap: wrap;
          }

          .header-actions {
            width: 100%;
            overflow: visible;
            padding-bottom: 0;
            justify-content: flex-start;
          }

          .catalog-head {
            flex-direction: column;
            align-items: stretch;
          }

          .search-input {
            width: 100%;
          }

          .product-grid {
            grid-template-columns:
              repeat(
                auto-fill,
                minmax(180px, 1fr)
              );
            gap: 12px;
          }

          .product-img-wrap {
            height: 190px;
          }

          .layout-container {
            padding-top: 24px;
          }

          .stock-list-row {
            grid-template-columns:
              1fr auto;
          }

          .stock-list-actions {
            grid-column: 1 / -1;
            justify-content: flex-start !important;
          }

          .stock-panel {
            padding: 15px;
          }
        }

        @media (max-width: 500px) {
          .stock-summary {
            grid-template-columns: 1fr;
          }

          .header-bar {
            padding: 12px 14px;
          }

          .layout-container {
            padding:
              20px 12px 40px;
          }

          .product-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .product-img-wrap {
            height: 160px;
          }

          .product-card h4 {
            font-size: 13px !important;
          }

          .toast-banner {
            right: 12px;
            left: 12px;
            max-width: none;
          }

          .header-actions .action-btn {
            padding: 8px 10px;
            font-size: 12px;
          }

          .modal-box {
            padding: 20px;
          }
        }
      `}</style>

      {/* =================================================
          TOAST
      ================================================= */}

      {toastMessage && (
        <div className="toast-banner">
          {toastMessage}
        </div>
      )}

      {/* =================================================
          HEADER
      ================================================= */}

      <Navbar
        role={currentUser.role}
        cartCount={totalCartCount}
        orderCount={visibleOrders.length}
        canManageStore={canManageStore}
        onAddProduct={() => setIsAddProductOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenSalesReports={() => setIsSalesReportsOpen(true)}
        onRegister={() => handleSwitchAccount(true)}
        onLogin={() => handleSwitchAccount(false)}
        onLogout={handleLogout}
      />

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="layout-container">
        {/* CATALOG HEADER */}

        <div className="catalog-head">
          <div>
            <h2
              style={{
                margin: 0,
              }}
            >
              Katalog Pakaian
            </h2>

            <p
              style={{
                color: "#64748b",
                margin: 0,
                fontSize: "14px",
              }}
            >
              Halo{" "}
              <b>
                {currentUser.name}
              </b>
              , temukan gaya berpakaian
              terbaikmu.
            </p>
          </div>

          <input
            className="search-input"
            type="text"
            placeholder="Cari pakaian..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />
        </div>

        <section className="collection-banner">
          <div className="collection-banner-copy">
            <span className="collection-banner-kicker">
              Koleksi pilihan · Gaya setiap hari
            </span>
            <h2>Gaya nyaman, percaya diri sepanjang hari.</h2>
            <p>
              Temukan pakaian favoritmu, pilih ukuran yang pas, lalu nikmati
              pengalaman belanja yang mudah di Toko Pakaian Bagus & Tasya.
            </p>
          </div>
          <span className="collection-banner-mark" aria-hidden="true">
            ✦
          </span>
        </section>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="stock-summary">
          <div className="stock-summary-card">
            <div className="stock-summary-label">
              📦 Jenis Produk
            </div>

            <div className="stock-summary-value">
              {totalProductTypes}
            </div>
          </div>

          <div className="stock-summary-card">
            <div className="stock-summary-label">
              📊 Total Semua Stok
            </div>

            <div className="stock-summary-value">
              {totalProductStock} pcs
            </div>
          </div>
        </div>

        {/* =================================================
            STOCK LIST
        ================================================= */}

        <div className="stock-panel">
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                }}
              >
                📋 Stok Semua Barang
              </h3>

              <p
                style={{
                  margin:
                    "4px 0 0",
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                Lihat stok setiap produk
                sekaligus.
              </p>

              <p
                style={{
                  margin:
                    "4px 0 0",
                  color: "#94a3b8",
                  fontSize: "11px",
                }}
              >
                ℹ️ Hapus/X di sini hanya
                menyembunyikan barang dari
                daftar stok.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {canManageStore &&
                hiddenStockListIds.length > 0 && (
                <button
                  onClick={
                    restoreStockList
                  }
                  style={{
                    border: 0,
                    background:
                      "#e2e8f0",
                    color: "#0f172a",
                    padding:
                      "5px 10px",
                    borderRadius:
                      "20px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor:
                      "pointer",
                  }}
                >
                  ↻ Tampilkan Semua
                </button>
              )}

              <span
                style={{
                  background:
                    "#eff6ff",
                  color: "#2563eb",
                  padding:
                    "5px 10px",
                  borderRadius:
                    "20px",
                  fontSize: "12px",
                  fontWeight: "700",
                }}
              >
                Total:{" "}
                {totalProductStock} pcs
              </span>
            </div>
          </div>

          {visibleStockProducts.length ===
          0 ? (
            <div
              style={{
                padding: "20px",
                textAlign:
                  "center",
                color: "#64748b",
                background:
                  "#f8fafc",
                borderRadius: "8px",
                border:
                  "1px dashed #cbd5e1",
              }}
            >
              Semua barang sudah
              disembunyikan dari daftar
              stok.

              <br />

              <span
                style={{
                  fontSize: "11px",
                }}
              >
                Produk tetap tersedia
                di katalog.
              </span>

              <br />

              {canManageStore && (
                <button
                  type="button"
                  onClick={restoreStockList}
                  style={{
                    marginTop: "10px",
                    border: 0,
                    background: "#3b82f6",
                    color: "#fff",
                    padding: "7px 12px",
                    borderRadius: "7px",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "12px",
                  }}
                >
                  Tampilkan Semua
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection:
                  "column",
                gap: "7px",
              }}
            >
              {visibleStockProducts.map(
                (product) => (
                  <div
                    key={`stock-${product.id}`}
                    className="stock-list-row"
                  >
                    <div
                      style={{
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          fontWeight:
                            "700",
                          fontSize:
                            "13px",
                          whiteSpace:
                            "nowrap",
                          overflow:
                            "hidden",
                          textOverflow:
                            "ellipsis",
                        }}
                      >
                        {product.name}
                      </div>

                      <div
                        style={{
                          color:
                            "#94a3b8",
                          fontSize:
                            "11px",
                        }}
                      >
                        {
                          product.category
                        }
                      </div>
                    </div>

                    <span
                      style={{
                        fontWeight:
                          "800",
                        fontSize:
                          "13px",
                        color:
                          product.stock >
                          0
                            ? "#15803d"
                            : "#dc2626",
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {product.stock}{" "}
                      pcs
                    </span>

                    {canManageStore && (
                      <div
                        className="stock-list-actions"
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: "4px",
                          flexWrap:
                            "wrap",
                          justifyContent:
                            "flex-end",
                        }}
                      >
                        <button
                          onClick={() =>
                            handleAddStock(
                              product.id
                            )
                          }
                          style={{
                            border: 0,
                            background:
                              "#334155",
                            color:
                              "#fff",
                            borderRadius:
                              "6px",
                            padding:
                              "5px 8px",
                            fontSize:
                              "11px",
                            fontWeight:
                              "700",
                            cursor:
                              "pointer",
                          }}
                        >
                          +5 Stok
                        </button>

                        <button
                          onClick={() =>
                            openEditProductModal(
                              product
                            )
                          }
                          style={{
                            border: 0,
                            background:
                              "#2563eb",
                            color:
                              "#fff",
                            borderRadius:
                              "6px",
                            padding:
                              "5px 8px",
                            fontSize:
                              "11px",
                            fontWeight:
                              "700",
                            cursor:
                              "pointer",
                          }}
                        >
                          ✏️ Edit
                        </button>

                        <button
                          onClick={() =>
                            hideFromStockList(
                              product.id
                            )
                          }
                          style={{
                            border: 0,
                            background:
                              "#ef4444",
                            color:
                              "#fff",
                            borderRadius:
                              "6px",
                            padding:
                              "5px 8px",
                            fontSize:
                              "11px",
                            fontWeight:
                              "700",
                            cursor:
                              "pointer",
                          }}
                        >
                          🗑️ Hapus
                        </button>

                        <button
                          onClick={() =>
                            hideFromStockList(
                              product.id
                            )
                          }
                          style={{
                            border: 0,
                            background:
                              "transparent",
                            color:
                              "#ef4444",
                            borderRadius:
                              "50%",
                            width:
                              "25px",
                            height:
                              "25px",
                            fontSize:
                              "14px",
                            fontWeight:
                              "900",
                            cursor:
                              "pointer",
                          }}
                          title="Sembunyikan dari daftar stok"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* =================================================
            CATEGORY
        ================================================= */}

        <div className="category-scroll" id="koleksi">
          {CATEGORIES.map(
            (category) => (
              <button
                key={
                  category.name
                }
                className={`cat-chip ${
                  selectedCategory ===
                  category.name
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setSelectedCategory(
                    category.name
                  )
                }
              >
                {category.label}
              </button>
            )
          )}
        </div>

        {/* =================================================
            PRODUCT
        ================================================= */}

        {filteredProducts.length ===
        0 ? (
          <div
            style={{
              background: "#fff",
              border:
                "1px solid #e2e8f0",
              borderRadius: "16px",
              padding:
                "48px 20px",
              textAlign:
                "center",
              color: "#64748b",
            }}
          >
            <div
              style={{
                fontSize: "42px",
                marginBottom:
                  "10px",
              }}
            >
              🔎
            </div>

            <h3
              style={{
                margin:
                  "0 0 6px",
                color:
                  "#0f172a",
              }}
            >
              Produk tidak ditemukan
            </h3>

            <p
              style={{
                margin: 0,
              }}
            >
              Coba gunakan kata kunci
              atau kategori yang
              berbeda.
            </p>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map(
              (product) => {
                const selectedSize =
                  selectedSizes[
                    product.id
                  ];

                return currentUser.role === "Pelanggan" ? (
                  <ProductCard
                    key={product.id}
                    product={product}
                    selectedSize={selectedSize}
                    canManageStore={canManageStore}
                    formatPrice={formatRupiah}
                    onSelectSize={selectSize}
                    onAddToCart={addToCart}
                    onEditProduct={openEditProductModal}
                    onAddStock={handleAddStock}
                    onDeleteProduct={handleDeleteProduct}
                  />
                ) : (
                  <div
                    key={
                      product.id
                    }
                    className="product-card"
                  >
                    {/* IMAGE */}

                    <div className="product-img-wrap">
                      <img
                        src={
                          product.image
                        }
                        alt={
                          product.name
                        }
                        className="product-img"
                        onError={(
                          event
                        ) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                        }}
                      />

                      <span
                        style={{
                          position:
                            "absolute",
                          bottom: 8,
                          left: 8,
                          background:
                            product.stock >
                            0
                              ? "#16a34a"
                              : "#ef4444",
                          color:
                            "#fff",
                          fontSize:
                            "10px",
                          padding:
                            "3px 7px",
                          borderRadius:
                            "4px",
                          fontWeight:
                            "bold",
                        }}
                      >
                        {product.stock >
                        0
                          ? `Stok: ${product.stock}`
                          : "Habis"}
                      </span>

                      {canManageStore && (
                        <button
                          onClick={() =>
                            handleDeleteProduct(
                              product.id
                            )
                          }
                          style={{
                            position:
                              "absolute",
                            top: 8,
                            right: 8,
                            background:
                              "rgba(239,68,68,.9)",
                            color:
                              "#fff",
                            border:
                              "none",
                            borderRadius:
                              "50%",
                            width:
                              "26px",
                            height:
                              "26px",
                            cursor:
                              "pointer",
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            fontSize:
                              "12px",
                            fontWeight:
                              "bold",
                          }}
                          title="Hapus Produk"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* PRODUCT CONTENT */}

                    <div className="product-card-content">
                      <span
                        style={{
                          fontSize:
                            "11px",
                          color:
                            "#3b82f6",
                          fontWeight:
                            "700",
                        }}
                      >
                        {
                          product.category
                        }
                      </span>

                      <h4
                        style={{
                          margin:
                            "4px 0 8px",
                          fontSize:
                            "15px",
                        }}
                      >
                        {
                          product.name
                        }
                      </h4>

                      <div
                        style={{
                          fontWeight:
                            "700",
                          fontSize:
                            "16px",
                          marginBottom:
                            "12px",
                        }}
                      >
                        {formatRupiah(
                          product.price
                        )}
                      </div>

                      {/* SIZE */}

                      <div
                        style={{
                          marginBottom:
                            "12px",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            gap:
                              "8px",
                            alignItems:
                              "center",
                            flexWrap:
                              "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontSize:
                                "11px",
                              color:
                                "#94a3b8",
                            }}
                          >
                            Ukuran:
                          </span>

                          {product.sizes.map(
                            (size) => (
                              <button
                                type="button"
                                key={
                                  size
                                }
                                className={`size-text ${
                                  selectedSize ===
                                  size
                                    ? "selected"
                                    : ""
                                }`}
                                aria-pressed={selectedSize === size}
                                onClick={() =>
                                  selectSize(
                                    product.id,
                                    size
                                  )
                                }
                              >
                                {size}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {/* ADMIN/KASIR */}

                      {canManageStore && (
                        <div
                          style={{
                            display:
                              "flex",
                            gap:
                              "4px",
                            marginBottom:
                              "8px",
                          }}
                        >
                          <button
                            style={{
                              flex: 1,
                              padding:
                                "5px",
                              background:
                                "#e2e8f0",
                              color:
                                "#0f172a",
                              border: 0,
                              borderRadius:
                                "4px",
                              fontSize:
                                "11px",
                              cursor:
                                "pointer",
                              fontWeight:
                                "bold",
                            }}
                            onClick={() =>
                              openEditProductModal(
                                product
                              )
                            }
                          >
                            ✏️ Edit
                          </button>

                          <button
                            style={{
                              flex: 1,
                              padding:
                                "5px",
                              background:
                                "#334155",
                              color:
                                "#fff",
                              border: 0,
                              borderRadius:
                                "4px",
                              fontSize:
                                "11px",
                              cursor:
                                "pointer",
                              fontWeight:
                                "700",
                            }}
                            onClick={() =>
                              handleAddStock(
                                product.id
                              )
                            }
                          >
                            +5 Stok
                          </button>

                          <button
                            style={{
                              padding:
                                "5px 8px",
                              background:
                                "#ef4444",
                              color:
                                "#fff",
                              border: 0,
                              borderRadius:
                                "4px",
                              fontSize:
                                "11px",
                              cursor:
                                "pointer",
                            }}
                            onClick={() =>
                              handleDeleteProduct(
                                product.id
                              )
                            }
                          >
                            🗑️
                          </button>
                        </div>
                      )}

                      {/* ADD CART */}

                      <button
                        className="action-btn primary"
                        style={{
                          marginTop:
                            "auto",
                          justifyContent:
                            "center",
                          opacity:
                            product.stock <=
                            0
                              ? 0.6
                              : 1,
                        }}
                        disabled={
                          product.stock <=
                          0
                        }
                        onClick={() =>
                          addToCart(
                            product
                          )
                        }
                      >
                        {product.stock >
                        0
                          ? "+ Tambah Ke Keranjang"
                          : "Stok Habis"}
                      </button>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </main>

      {/* =================================================
          CART DRAWER
      ================================================= */}

      {isCartOpen && (
        <>
          <div
            className="drawer-overlay"
            onClick={() =>
              setIsCartOpen(false)
            }
          />

          <div className="drawer-content cart-drawer">
            <div
              className="cart-header"
            >
              <div>
                <span className="cart-kicker">PESANAN ANDA</span>
                <h3>
                  Keranjang Belanja
                  <span className="cart-count">{totalCartCount}</span>
                </h3>
              </div>

              <div className="cart-header-account">
                {hasStoreBankAccount ? (
                  <>
                    <span className="bank-account-label">REKENING TOKO</span>
                    <strong className="bank-account-number">
                      {STORE_ACCOUNT_NUMBER}
                    </strong>
                    <span>
                      {STORE_BANK_NAME} · a.n. {STORE_ACCOUNT_HOLDER}
                    </span>
                  </>
                ) : (
                  <span className="cart-account-missing">
                    Nomor rekening belum diatur
                  </span>
                )}
              </div>

              <button
                className="close-btn"
                aria-label="Tutup keranjang"
                onClick={() =>
                  setIsCartOpen(false)
                }
              >
                ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <span className="cart-empty-icon">🛍️</span>
                <h4>Keranjang masih kosong</h4>
                <p>
                  Yuk, pilih pakaian favoritmu dan tambahkan ke keranjang.
                </p>
                <button
                  className="action-btn primary"
                  onClick={() => setIsCartOpen(false)}
                >
                  Lanjut Belanja
                </button>
              </div>
            ) : (
              <>
                <div
                  className="cart-items"
                >
                  {cart.map(
                    (item) => (
                      <div
                        key={`${item.product.id}-${item.selectedSize}`}
                        className="cart-item"
                      >
                        <img
                          src={
                            item.product
                              .image
                          }
                          alt={
                            item.product
                              .name
                          }
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                          }}
                          className="cart-item-image"
                        />

                        <div className="cart-item-details">
                          <div className="cart-item-heading">
                            <h5>
                              {
                                item
                                  .product
                                  .name
                              }
                            </h5>

                            <button
                              className="close-btn"
                              aria-label={`Hapus ${item.product.name} dari keranjang`}
                              onClick={() =>
                                removeCartItem(
                                  item
                                    .product
                                    .id,
                                  item.selectedSize
                                )
                              }
                            >
                              ✕
                            </button>
                          </div>

                          <div
                            className="cart-item-meta"
                          >
                            Ukuran:{" "}
                            <b>
                              {
                                item.selectedSize
                              }
                            </b>{" "}
                            |{" "}
                            {formatRupiah(
                              item
                                .product
                                .price
                            )}
                          </div>

                          <div
                            className="cart-item-controls"
                          >
                            <button
                              className="qty-text-btn"
                              aria-label={`Kurangi jumlah ${item.product.name}, ukuran ${item.selectedSize}`}
                              onClick={() =>
                                updateCartQty(
                                  item
                                    .product
                                    .id,
                                  item.selectedSize,
                                  -1
                                )
                              }
                            >
                              -
                            </button>

                            <span className="cart-item-quantity">
                              {
                                item.quantity
                              }
                            </span>

                            <button
                              className="qty-text-btn"
                              aria-label={`Tambah jumlah ${item.product.name}, ukuran ${item.selectedSize}`}
                              onClick={() =>
                                updateCartQty(
                                  item
                                    .product
                                    .id,
                                  item.selectedSize,
                                  1
                                )
                              }
                            >
                              +
                            </button>

                            <button
                              className="cart-item-remove"
                              onClick={() =>
                                removeCartItem(
                                  item
                                    .product
                                    .id,
                                  item.selectedSize
                                )
                              }
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* PAYMENT */}

                <div
                  className="cart-checkout"
                >
                  <label className="payment-label" htmlFor="cart-payment-method">
                    Metode Pembayaran
                  </label>

                  <select
                    id="cart-payment-method"
                    className="form-input cart-payment-select"
                    value={
                      paymentMethod
                    }
                    onChange={(
                      event
                    ) =>
                      setPaymentMethod(
                        event
                          .target
                          .value
                      )
                    }
                  >
                    <option value="Transfer BRI (ATM/BRImo)">
                      Transfer {STORE_BANK_NAME || "bank tujuan toko"}
                    </option>
                    <option value="Transfer Bank Lain">
                      Transfer dari bank lain
                    </option>
                    <option value="QRIS / e-Wallet">
                      QRIS / e-Wallet
                    </option>
                    <option value="Kartu Debit/Kredit">
                      Kartu debit/kredit
                    </option>
                    <option value="PayLater">
                      PayLater (Simulasi)
                    </option>
                    <option value="Tunai / Kasir">
                      Tunai (Bayar di kasir)
                    </option>
                    <option value="Checkout WhatsApp">
                      Checkout otomatis ke WhatsApp
                    </option>
                  </select>

                  <div
                    className="payment-info"
                  >
                    <strong>
                      {paymentMethod === "Checkout WhatsApp"
                        ? "Checkout melalui WhatsApp"
                        : "Instruksi pembayaran simulasi"}
                    </strong>
                    {paymentMethod === "Checkout WhatsApp" && (
                      <p style={{ margin: "6px 0 0" }}>
                        Setelah checkout, WhatsApp akan terbuka dengan detail pesanan. Periksa
                        lalu kirim pesan untuk mengirim pesanan ke toko. Pembayaran belum
                        diproses otomatis.
                      </p>
                    )}
                    {paymentMethod === "Transfer BRI (ATM/BRImo)" && (
                      <p>
                        Transfer ke rekening toko yang tertera di bagian atas. Pastikan nama
                        penerima sesuai sebelum melakukan transfer.
                      </p>
                    )}
                    {paymentMethod === "Transfer Bank Lain" && (
                      <p>
                        Gunakan menu transfer antarbank ke rekening toko yang tertera di bagian
                        atas.
                      </p>
                    )}
                    {paymentMethod === "QRIS / e-Wallet" && (
                      <p>
                        Pada pembayaran sungguhan, pindai kode QR dari penyedia pembayaran.
                        Aplikasi demo ini tidak membuat QR atau memproses transaksi.
                      </p>
                    )}
                    {paymentMethod === "Kartu Debit/Kredit" && (
                      <p>
                        Pembayaran kartu hanya simulasi. Jangan masukkan atau kirim nomor kartu
                        asli melalui aplikasi ini.
                      </p>
                    )}
                    {paymentMethod === "PayLater" && (
                      <div>
                        <p>
                          Pilih tenor simulasi. Cicilan ini perkiraan tanpa bunga dan tidak
                          membuat pengajuan kredit.
                        </p>
                        <select
                          className="form-input"
                          aria-label="Tenor PayLater simulasi"
                          value={payLaterTenor}
                          onChange={(event) =>
                            setPayLaterTenor(Number(event.target.value))
                          }
                        >
                          <option value={3}>3 bulan</option>
                          <option value={6}>6 bulan</option>
                          <option value={12}>12 bulan</option>
                        </select>
                        <p>
                          Perkiraan cicilan:{" "}
                          <strong>
                            {formatRupiah(
                              Math.ceil(totalCartPrice / payLaterTenor),
                            )}{" "}
                            / bulan
                          </strong>
                        </p>
                      </div>
                    )}
                    {paymentMethod === "Tunai / Kasir" && (
                      <p>
                        Siapkan pembayaran tunai sebesar total tagihan dan bayarkan kepada kasir.
                      </p>
                    )}
                    {paymentMethod !== "Checkout WhatsApp" && (
                      <p className="payment-disclaimer">
                        Demo saja: checkout akan membuat pesanan, tetapi tidak memverifikasi atau
                        menerima pembayaran sungguhan.
                      </p>
                    )}
                  </div>

                  <div
                    className="cart-total"
                  >
                    <span>
                      Total Tagihan:
                    </span>

                    <span className="cart-total-amount">
                      {formatRupiah(
                        totalCartPrice
                      )}
                    </span>
                  </div>

                  <button
                    className="action-btn success cart-checkout-button"
                    onClick={
                      handleCheckout
                    }
                  >
                    {paymentMethod === "Checkout WhatsApp"
                      ? "Lanjutkan ke WhatsApp"
                      : "Checkout Sekarang"}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* =================================================
          ORDERS MODAL
      ================================================= */}

      {isOrdersOpen && (
        <>
          <div
            className="drawer-overlay"
            onClick={() =>
              setIsOrdersOpen(false)
            }
          />

          <div className="modal-box">
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom:
                  "16px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                }}
              >
                📦 Riwayat Pesanan
              </h3>

              <button
                className="close-btn"
                onClick={() =>
                  setIsOrdersOpen(false)
                }
              >
                ✕
              </button>
            </div>

            {visibleOrders.length === 0 ? (
              <p
                style={{
                  color:
                    "#64748b",
                  textAlign:
                    "center",
                }}
              >
                Belum ada pesanan yang
                dibuat.
              </p>
            ) : (
              <div
                style={{
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  gap:
                    "12px",
                }}
              >
                {visibleOrders.map(
                  (order) => (
                    <div
                      key={
                        order.id
                      }
                      style={{
                        border:
                          "1px solid #e2e8f0",
                        borderRadius:
                          "10px",
                        padding:
                          "12px",
                      }}
                    >
                      {/* ORDER HEADER */}

                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          gap:
                            "8px",
                          fontSize:
                            "12px",
                          color:
                            "#64748b",
                          marginBottom:
                            "8px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <span>
                          <b>
                            {
                              order.id
                            }
                          </b>{" "}
                          |{" "}
                          {
                            order.date
                          }
                        </span>

                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap:
                              "6px",
                            flexWrap:
                              "wrap",
                          }}
                        >
                          <span
                            style={{
                              background:
                                order.status ===
                                "Selesai"
                                  ? "#dcfce7"
                                  : order.status ===
                                    "Dikirim"
                                  ? "#dbeafe"
                                  : "#fef3c7",
                              color:
                                order.status ===
                                "Selesai"
                                  ? "#15803d"
                                  : order.status ===
                                    "Dikirim"
                                  ? "#2563eb"
                                  : "#b45309",
                              padding:
                                "2px 6px",
                              borderRadius:
                                "4px",
                              fontWeight:
                                "bold",
                              fontSize:
                                "11px",
                            }}
                          >
                            {
                              order.status
                            }
                          </span>

                          {canManageStore && (
                            <>
                              <button
                                className="order-btn"
                                title="Edit Status"
                                onClick={() =>
                                  setEditingOrderId(
                                    editingOrderId ===
                                      order.id
                                      ? null
                                      : order.id
                                  )
                                }
                                style={{
                                  color:
                                    "#3b82f6",
                                }}
                              >
                                ✏️ Edit
                              </button>

                              <button
                                className="order-btn"
                                title="Hapus Pesanan"
                                onClick={() =>
                                  handleDeleteOrder(
                                    order.id
                                  )
                                }
                                style={{
                                  color:
                                    "#ef4444",
                                }}
                              >
                                🗑️ Hapus
                              </button>
                            </>
                          )}

                        </div>
                      </div>

                      {/* EDIT STATUS */}

                      {editingOrderId ===
                        order.id &&
                        canManageStore && (
                          <div
                            style={{
                              background:
                                "#f8fafc",
                              padding:
                                "8px",
                              borderRadius:
                                "6px",
                              marginBottom:
                                "8px",
                              border:
                                "1px solid #cbd5e1",
                            }}
                          >
                            <span
                              style={{
                                fontSize:
                                  "11px",
                                fontWeight:
                                  "bold",
                                display:
                                  "block",
                                marginBottom:
                                  "4px",
                              }}
                            >
                              Ubah Status
                              Pesanan:
                            </span>

                            <div
                              style={{
                                display:
                                  "flex",
                                gap:
                                  "4px",
                              }}
                            >
                              {(
                                [
                                  "Diproses",
                                  "Dikirim",
                                  "Selesai",
                                ] as OrderStatus[]
                              ).map(
                                (
                                  status
                                ) => (
                                  <button
                                    key={
                                      status
                                    }
                                    style={{
                                      flex: 1,
                                      padding:
                                        "5px",
                                      fontSize:
                                        "11px",
                                      borderRadius:
                                        "4px",
                                      border:
                                        "1px solid #cbd5e1",
                                      background:
                                        order.status ===
                                        status
                                          ? "#0f172a"
                                          : "#fff",
                                      color:
                                        order.status ===
                                        status
                                          ? "#fff"
                                          : "#0f172a",
                                      cursor:
                                        "pointer",
                                    }}
                                    onClick={() =>
                                      handleUpdateOrderStatus(
                                        order.id,
                                        status
                                      )
                                    }
                                  >
                                    {
                                      status
                                    }
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* ORDER ITEMS */}

                      {order.items.map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={
                              `${order.id}-${index}`
                            }
                            style={{
                              fontSize:
                                "13px",
                              margin:
                                "2px 0",
                            }}
                          >
                            •{" "}
                            {
                              item
                                .product
                                .name
                            }{" "}
                            (
                            {
                              item.selectedSize
                            }
                            ){" "}
                            x
                            {
                              item.quantity
                            }
                          </div>
                        )
                      )}

                      <div
                        style={{
                          borderTop:
                            "1px dashed #e2e8f0",
                          marginTop:
                            "8px",
                          paddingTop:
                            "6px",
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          gap:
                            "10px",
                          fontSize:
                            "13px",
                          fontWeight:
                            "bold",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <span>
                          Total (
                          {
                            order.paymentMethod
                          }
                          ):
                        </span>

                        <span>
                          {formatRupiah(
                            order.totalPrice
                          )}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </>
      )}

      <SalesReportsModal
        isOpen={isSalesReportsOpen && canManageStore}
        onClose={() => setIsSalesReportsOpen(false)}
        orders={orders}
        formatRupiah={formatRupiah}
      />

      {/* =================================================
          EDIT PRODUCT MODAL
      ================================================= */}

      {editingProduct && (
        <>
          <div
            className="drawer-overlay"
            onClick={() =>
              setEditingProduct(null)
            }
          />

          <div className="modal-box edit-product-modal">
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom:
                  "16px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                }}
              >
                ✏️ Edit Produk Pakaian
              </h3>

              <button
                className="close-btn"
                onClick={() =>
                  setEditingProduct(null)
                }
              >
                ✕
              </button>
            </div>

            <form
              className="edit-product-form"
              onSubmit={
                handleEditProductSubmit
              }
            >
              <label
                style={{
                  fontSize:
                    "12px",
                  fontWeight:
                    "bold",
                }}
              >
                Nama Produk
              </label>

              <input
                className="form-input"
                value={
                  editProductForm.name
                }
                onChange={(
                  event
                ) =>
                  setEditProductForm(
                    {
                      ...editProductForm,
                      name:
                        event
                          .target
                          .value,
                    }
                  )
                }
                required
              />

              <label
                style={{
                  fontSize:
                    "12px",
                  fontWeight:
                    "bold",
                }}
              >
                Harga (Rp)
              </label>

              <input
                className="form-input"
                type="number"
                min="0"
                value={
                  editProductForm.price
                }
                onChange={(
                  event
                ) =>
                  setEditProductForm(
                    {
                      ...editProductForm,
                      price:
                        event
                          .target
                          .value,
                    }
                  )
                }
                required
              />

              <label
                style={{
                  fontSize:
                    "12px",
                  fontWeight:
                    "bold",
                }}
              >
                Kategori
              </label>

              <select
                className="form-input"
                value={
                  editProductForm.category
                }
                onChange={(
                  event
                ) =>
                  setEditProductForm(
                    {
                      ...editProductForm,
                      category:
                        event
                          .target
                          .value as ProductCategory,
                    }
                  )
                }
              >
                {CATEGORIES.filter(
                  (category) =>
                    category.name !==
                    "Semua"
                ).map(
                  (category) => (
                    <option
                      key={
                        category.name
                      }
                      value={
                        category.name
                      }
                    >
                      {
                        category.name
                      }
                    </option>
                  )
                )}
              </select>

              <label
                style={{
                  fontSize:
                    "12px",
                  fontWeight:
                    "bold",
                }}
              >
                Ukuran
              </label>

              <input
                className="form-input"
                placeholder="S, M, L, XL"
                value={
                  editProductForm.sizes
                }
                onChange={(
                  event
                ) =>
                  setEditProductForm(
                    {
                      ...editProductForm,
                      sizes:
                        event
                          .target
                          .value,
                    }
                  )
                }
              />

              <label
                style={{
                  fontSize:
                    "12px",
                  fontWeight:
                    "bold",
                }}
              >
                Jumlah Stok
              </label>

              <input
                className="form-input"
                type="number"
                min="0"
                value={
                  editProductForm.stock
                }
                onChange={(
                  event
                ) =>
                  setEditProductForm(
                    {
                      ...editProductForm,
                      stock:
                        event
                          .target
                          .value,
                    }
                  )
                }
              />

              <label
                style={{
                  fontSize:
                    "12px",
                  fontWeight:
                    "bold",
                }}
              >
                URL Gambar Produk
              </label>

              <input
                className="form-input"
                type="url"
                placeholder="https://contoh.com/gambar-produk.jpg"
                value={editProductForm.image}
                onChange={(event) =>
                  setEditProductForm({
                    ...editProductForm,
                    image: event.target.value,
                  })
                }
              />

              <div
                style={{
                  display:
                    "flex",
                  gap:
                    "8px",
                  marginTop:
                    "12px",
                }}
              >
                <button
                  type="button"
                  className="action-btn"
                  style={{
                    flex: 1,
                  }}
                  onClick={() =>
                    setEditingProduct(
                      null
                    )
                  }
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="action-btn primary"
                  style={{
                    flex: 1,
                  }}
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* =================================================
          ADD PRODUCT MODAL
      ================================================= */}

      {isAddProductOpen && (
        <>
          <div
            className="drawer-overlay"
            onClick={() =>
              setIsAddProductOpen(
                false
              )
            }
          />

          <div className="modal-box add-product-modal">
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom:
                  "16px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                }}
              >
                ➕ Tambah Produk Pakaian
              </h3>

              <button
                className="close-btn"
                onClick={() =>
                  setIsAddProductOpen(
                    false
                  )
                }
              >
                ✕
              </button>
            </div>

            <form
              className="add-product-form"
              onSubmit={
                handleAddProductSubmit
              }
            >
              <label
                style={{
                  fontSize:
                    "12px",
                  fontWeight:
                    "bold",
                }}
              >
                Nama Produk
              </label>

              <input
                className="form-input"
                placeholder="Contoh: Jaket Denim Casual"
                value={
                  newProduct.name
                }
                onChange={(
                  event
                ) =>
                  setNewProduct({
                    ...newProduct,
                    name:
                      event
                        .target
                        .value,
                  })
                }
                required
              />

              <label
                style={{
                  fontSize:
                    "12px",
                  fontWeight:
                    "bold",
                }}
              >
                Harga (Rp)
              </label>

              <input
                className="form-input"
                type="number"
                min="0"
                placeholder="150000"
                value={
                  newProduct.price
                }
                onChange={(
                  event
                ) =>
                  setNewProduct({
                    ...newProduct,
                    price:
                      event
                        .target
                        .value,
                  })
                }
                required
              />

              <label
                style={{
                  fontSize:
                    "12px",
                  fontWeight:
                    "bold",
                }}
              >
                Kategori
              </label>

              <select
                className="form-input"
                value={
                  newProduct.category
                }
                onChange={(
                  event
                ) =>
                  setNewProduct({
                    ...newProduct,
                    category:
                      event
                        .target
                        .value as ProductCategory,
                  })
                }
              >
                {CATEGORIES.filter(
                  (category) =>
                    category.name !==
                    "Semua"
                ).map(
                  (category) => (
                    <option
                      key={
                        category.name
                      }
                      value={
                        category.name
                      }
                    >
                      {
                        category.name
                      }
                    </option>
                  )
                )}
              </select>

              <label
                style={{
                  fontSize:
                    "12px",
                  fontWeight:
                    "bold",
                }}
              >
                Ukuran
              </label>

              <input
                className="form-input"
                placeholder="S, M, L, XL"
                value={
                  newProduct.sizes
                }
                onChange={(
                  event
                ) =>
                  setNewProduct({
                    ...newProduct,
                    sizes:
                      event
                        .target
                        .value,
                  })
                }
              />

              <label
                style={{
                  fontSize:
                    "12px",
                  fontWeight:
                    "bold",
                }}
              >
                Jumlah Stok Awal
              </label>

              <input
                className="form-input"
                type="number"
                min="0"
                value={
                  newProduct.stock
                }
                onChange={(
                  event
                ) =>
                  setNewProduct({
                    ...newProduct,
                    stock:
                      event
                        .target
                        .value,
                  })
                }
              />

              <label
                style={{
                  fontSize:
                    "12px",
                  fontWeight:
                    "bold",
                }}
              >
                URL Gambar Produk (Opsional)
              </label>

              <input
                className="form-input"
                type="url"
                placeholder="https://contoh.com/gambar-produk.jpg"
                value={newProduct.image}
                onChange={(event) =>
                  setNewProduct({
                    ...newProduct,
                    image: event.target.value,
                  })
                }
              />

              <div
                style={{
                  display:
                    "flex",
                  gap:
                    "8px",
                  marginTop:
                    "12px",
                }}
              >
                <button
                  type="button"
                  className="action-btn"
                  style={{
                    flex: 1,
                  }}
                  onClick={() =>
                    setIsAddProductOpen(
                      false
                    )
                  }
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="action-btn success"
                  style={{
                    flex: 1,
                  }}
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}