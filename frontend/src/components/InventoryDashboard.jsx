import { useMemo, useState } from "react";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const emptyProduct = {
  id: "",
  sku: "",
  name: "",
  category: "Bebidas",
  price: "",
  stock: "",
  minimumStock: "5",
};

export default function InventoryDashboard({
  products,
  canManageProducts,
  onSaveProduct,
  onDeleteProduct,
  onUpdateStock,
}) {
  const [form, setForm] = useState(emptyProduct);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [feedback, setFeedback] = useState("");

  const categories = useMemo(
    () => ["Todas", ...new Set(products.map((product) => product.category))],
    [products],
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = category === "Todas" || product.category === category;
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [category, products, search]);

  const totals = useMemo(
    () => ({
      products: products.length,
      units: products.reduce((sum, product) => sum + product.stock, 0),
      value: products.reduce((sum, product) => sum + product.stock * product.price, 0),
      lowStock: products.filter((product) => product.stock <= product.minimumStock).length,
    }),
    [products],
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submitProduct(event) {
    event.preventDefault();
    const result = onSaveProduct({
      ...form,
      sku: form.sku.trim().toUpperCase(),
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      stock: Math.max(0, Number(form.stock) || 0),
      minimumStock: Math.max(0, Number(form.minimumStock) || 0),
    });

    setFeedback(result.message);
    if (result.ok) {
      setForm(emptyProduct);
    }
  }

  function editProduct(product) {
    setForm({
      ...product,
      price: String(product.price),
      stock: String(product.stock),
      minimumStock: String(product.minimumStock),
    });
    setFeedback("");
  }

  function deleteProduct(product) {
    if (!window.confirm(`Eliminar ${product.name} del inventario?`)) {
      return;
    }

    onDeleteProduct(product.id);
    if (form.id === product.id) {
      setForm(emptyProduct);
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Productos registrados", totals.products, "text-slate-950 dark:text-white"],
          ["Unidades disponibles", totals.units, "text-sky-600 dark:text-sky-400"],
          ["Valor del inventario", currency.format(totals.value), "text-emerald-600 dark:text-emerald-400"],
          ["Stock bajo", totals.lowStock, totals.lowStock ? "text-rose-600 dark:text-rose-400" : "text-emerald-600"],
        ].map(([label, value, tone]) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
            <p className={`mt-2 text-2xl font-bold tracking-tight ${tone}`}>{value}</p>
          </article>
        ))}
      </div>

      {!canManageProducts ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
          Recepcion puede actualizar cantidades. Los datos del producto y su eliminacion estan reservados para administracion.
        </div>
      ) : null}

      <div className={`grid gap-6 ${canManageProducts ? "xl:grid-cols-[360px_minmax(0,1fr)]" : ""}`}>
        {canManageProducts ? (
          <form
            onSubmit={submitProduct}
            className="h-fit rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="text-lg font-bold">{form.id ? "Editar producto" : "Agregar producto"}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Registra productos vendidos en la recepcion del gimnasio.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold">Nombre</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                  placeholder="Agua mineral"
                  required
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <label>
                  <span className="text-sm font-semibold">Codigo SKU</span>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(event) => updateField("sku", event.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm uppercase dark:border-slate-700 dark:bg-slate-950"
                    placeholder="BEB-001"
                    required
                  />
                </label>
                <label>
                  <span className="text-sm font-semibold">Categoria</span>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(event) => updateField("category", event.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                    list="inventory-categories"
                    required
                  />
                  <datalist id="inventory-categories">
                    <option value="Bebidas" />
                    <option value="Suplementos" />
                    <option value="Snacks" />
                    <option value="Accesorios" />
                    <option value="Ropa" />
                  </datalist>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label>
                  <span className="text-sm font-semibold">Precio COP</span>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(event) => updateField("price", event.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                    required
                  />
                </label>
                <label>
                  <span className="text-sm font-semibold">Cantidad</span>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(event) => updateField("stock", event.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold">Alerta de stock minimo</span>
                <input
                  type="number"
                  min="0"
                  value={form.minimumStock}
                  onChange={(event) => updateField("minimumStock", event.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                  required
                />
              </label>
            </div>

            {feedback ? (
              <p className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {feedback}
              </p>
            ) : null}

            <div className="mt-5 flex gap-3">
              <button
                type="submit"
                className="h-11 flex-1 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white transition hover:bg-emerald-600"
              >
                {form.id ? "Guardar cambios" : "Agregar producto"}
              </button>
              {form.id ? (
                <button
                  type="button"
                  onClick={() => {
                    setForm(emptyProduct);
                    setFeedback("");
                  }}
                  className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-bold">Productos</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Ajusta existencias y detecta productos que necesitan reposicion.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="sr-only">Buscar producto</span>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                    placeholder="Buscar producto o SKU"
                  />
                </label>
                <label>
                  <span className="sr-only">Filtrar categoria</span>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    {categories.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-950/60">
                <tr>
                  <th className="px-5 py-3">Producto</th>
                  <th className="px-5 py-3">Precio</th>
                  <th className="px-5 py-3">Existencias</th>
                  <th className="px-5 py-3">Estado</th>
                  {canManageProducts ? <th className="px-5 py-3 text-right">Acciones</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.map((product) => {
                  const isLowStock = product.stock <= product.minimumStock;
                  return (
                    <tr key={product.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold">{product.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{product.sku} - {product.category}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold">{currency.format(product.price)}</td>
                      <td className="px-5 py-4">
                        <div className="flex min-w-[148px] items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onUpdateStock(product.id, product.stock - 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-lg font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                            disabled={product.stock === 0}
                            aria-label={`Restar una unidad de ${product.name}`}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={product.stock}
                            onChange={(event) => {
                              if (event.target.value !== "") {
                                onUpdateStock(product.id, event.target.value);
                              }
                            }}
                            className="h-9 w-16 rounded-xl border border-slate-200 bg-white px-2 text-center font-bold dark:border-slate-700 dark:bg-slate-950"
                            aria-label={`Cantidad de ${product.name}`}
                          />
                          <button
                            type="button"
                            onClick={() => onUpdateStock(product.id, product.stock + 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-lg font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-300"
                            aria-label={`Agregar una unidad de ${product.name}`}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                          isLowStock
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                        }`}>
                          {isLowStock ? `Stock bajo (min. ${product.minimumStock})` : "Disponible"}
                        </span>
                      </td>
                      {canManageProducts ? (
                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => editProduct(product)}
                            className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteProduct(product)}
                            className="ml-4 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400"
                          >
                            Eliminar
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!filteredProducts.length ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              No hay productos que coincidan con la busqueda.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
