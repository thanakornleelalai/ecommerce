"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Customer {
  id: number;
  name: string;
  email: string;
}
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}
interface Order {
  id: number;
  total: number;
  status: string;
}

interface Stats {
  customers: number;
  products: number;
  orders: number;
  revenue: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [cRes, pRes, oRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/products"),
          fetch("/api/orders"),
        ]);
        if (!cRes.ok || !pRes.ok || !oRes.ok) {
          throw new Error("Failed to load dashboard data");
        }
        const customers: Customer[] = await cRes.json();
        const products: Product[] = await pRes.json();
        const orders: Order[] = await oRes.json();

        const revenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
        setStats({
          customers: customers.length,
          products: products.length,
          orders: orders.length,
          revenue,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards = [
    { label: "Customers", value: stats?.customers ?? 0, href: "/customers" },
    { label: "Products", value: stats?.products ?? 0, href: "/products" },
    { label: "Orders", value: stats?.orders ?? 0, href: "/orders" },
    {
      label: "Revenue",
      value: stats ? `$${stats.revenue.toFixed(2)}` : "$0.00",
      href: "/orders",
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Dashboard</h1>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {card.value}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
