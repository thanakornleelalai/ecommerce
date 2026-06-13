"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";

interface Customer {
  id: number;
  name: string;
}
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}
interface Order {
  id: number;
  customer_id: number;
  customer_name: string | null;
  total: number;
  status: string;
  created_at: string;
}
interface CartLine {
  product_id: number;
  quantity: number;
}

const ORDER_STATUSES = ["pending", "paid", "shipped", "cancelled"] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderIds, setUpdatingOrderIds] = useState<number[]>([]);

  // Order builder state
  const [customerId, setCustomerId] = useState<string>("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [oRes, cRes, pRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/customers"),
        fetch("/api/products"),
      ]);
      if (!oRes.ok || !cRes.ok || !pRes.ok) {
        throw new Error("Failed to load data");
      }
      setOrders(await oRes.json());
      setCustomers(await cRes.json());
      setProducts(await pRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleOrderStatusChange(orderId: number, status: OrderStatus) {
    setUpdatingOrderIds((prev) => [...prev, orderId]);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update order");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUpdatingOrderIds((prev) => prev.filter((id) => id !== orderId));
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const productById = useMemo(() => {
    const map = new Map<number, Product>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  const total = useMemo(
    () =>
      cart.reduce((sum, line) => {
        const product = productById.get(line.product_id);
        return sum + (product ? Number(product.price) * line.quantity : 0);
      }, 0),
    [cart, productById]
  );

  function addToCart() {
    setFormError(null);
    const pid = Number(selectedProduct);
    const qty = Number(quantity);
    if (!pid) {
      setFormError("Select a product to add");
      return;
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      setFormError("Quantity must be at least 1");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.product_id === pid);
      if (existing) {
        return prev.map((l) =>
          l.product_id === pid ? { ...l, quantity: l.quantity + qty } : l
        );
      }
      return [...prev, { product_id: pid, quantity: qty }];
    });
    setSelectedProduct("");
    setQuantity("1");
  }

  function removeLine(pid: number) {
    setCart((prev) => prev.filter((l) => l.product_id !== pid));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);

    if (!customerId) {
      setFormError("Please select a customer");
      return;
    }
    if (cart.length === 0) {
      setFormError("Add at least one product to the order");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: Number(customerId),
          items: cart,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create order");
      setSuccess(`Order #${data.id} created successfully`);
      setCustomerId("");
      setCart([]);
      await loadAll();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Orders</h1>

      {/* New order builder */}
      <form
        onSubmit={handleSubmit}
        className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-800">New order</h2>

        {/* Customer */}
        <label className="mb-1 block text-sm font-medium text-slate-600">
          Customer
        </label>
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none sm:w-72"
        >
          <option value="">— Select a customer —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Add product line */}
        <label className="mb-1 block text-sm font-medium text-slate-600">
          Add product
        </label>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="">— Select a product —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — ${Number(p.price).toFixed(2)} (stock: {p.stock})
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none sm:w-24"
          />
          <button
            type="button"
            onClick={addToCart}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Add item
          </button>
        </div>

        {/* Cart */}
        {cart.length > 0 && (
          <div className="mb-4 overflow-x-auto rounded-md border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Product</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">Price</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">Qty</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">Subtotal</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cart.map((line) => {
                  const product = productById.get(line.product_id);
                  const price = product ? Number(product.price) : 0;
                  return (
                    <tr key={line.product_id}>
                      <td className="px-3 py-2 text-slate-900">
                        {product?.name ?? `#${line.product_id}`}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        ${price.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {line.quantity}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        ${(price * line.quantity).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeLine(line.product_id)}
                          className="text-sm font-medium text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50">
                  <td colSpan={3} className="px-3 py-2 text-right font-semibold text-slate-700">
                    Total
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-slate-900">
                    ${total.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {formError && <p className="mb-3 text-sm text-red-600">{formError}</p>}
        {success && <p className="mb-3 text-sm text-green-600">{success}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Create order"}
        </button>
      </form>

      {/* Orders list */}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">ID</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Customer</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Total</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{o.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {o.customer_name ?? `Customer #${o.customer_id}`}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    ${Number(o.total).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => handleOrderStatusChange(o.id, e.target.value as OrderStatus)}
                      disabled={updatingOrderIds.includes(o.id)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
