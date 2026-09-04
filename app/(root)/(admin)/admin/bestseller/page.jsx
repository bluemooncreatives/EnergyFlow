'use client'

import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import Image from 'next/image'
import { ArrowDown, ArrowUp, Plus, Trash2, Crown, GripVertical } from 'lucide-react'

import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import PageHeader from '@/components/Application/Admin/PageHeader'
import ButtonLoading from '@/components/Application/ButtonLoading'
import Select from '@/components/Application/Select'
import { Button } from '@/components/ui/button'
import { showToast } from '@/lib/showToast'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { ADMIN_BESTSELLER_SHOW, ADMIN_DASHBOARD } from '@/routes/AdminPanelRoute'

const breadcrumbData = [
  { href: ADMIN_DASHBOARD, label: 'Home' },
  { href: ADMIN_BESTSELLER_SHOW, label: 'Bestsellers' },
]

const formatPrice = (price) =>
  typeof price === 'number' ? `₹${price.toLocaleString('en-IN')}` : '—'

const ShowBestseller = () => {
  const [bestsellers, setBestsellers] = useState([])
  const [available, setAvailable] = useState([])
  const [selectedIds, setSelectedIds] = useState([])

  const [loadingList, setLoadingList] = useState(true)
  const [adding, setAdding] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const [orderDirty, setOrderDirty] = useState(false)

  const availableOptions = useMemo(
    () => available.map((p) => ({ label: p.name, value: p._id })),
    [available]
  )

  const loadBestsellers = async () => {
    try {
      const { data } = await axios.get('/api/bestseller')
      if (!data.success) throw new Error(data.message)
      setBestsellers(data.data || [])
      setOrderDirty(false)
    } catch (error) {
      showToast('error', error.message)
    }
  }

  const loadAvailable = async () => {
    try {
      const { data } = await axios.get('/api/bestseller/available')
      if (!data.success) throw new Error(data.message)
      setAvailable(data.data || [])
    } catch (error) {
      showToast('error', error.message)
    }
  }

  const refresh = async () => {
    setLoadingList(true)
    await Promise.all([loadBestsellers(), loadAvailable()])
    setSelectedIds([])
    setLoadingList(false)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAdd = async () => {
    if (selectedIds.length === 0) {
      return showToast('error', 'Select at least one product.')
    }
    setAdding(true)
    try {
      const { data } = await axios.post('/api/bestseller', { ids: selectedIds })
      if (!data.success) throw new Error(data.message)
      showToast('success', data.message)
      await refresh()
    } catch (error) {
      showToast('error', error.message)
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (id) => {
    setRemovingId(id)
    try {
      const { data } = await axios.delete('/api/bestseller', { data: { ids: [id] } })
      if (!data.success) throw new Error(data.message)
      showToast('success', data.message)
      await refresh()
    } catch (error) {
      showToast('error', error.message)
    } finally {
      setRemovingId(null)
    }
  }

  const move = (index, dir) => {
    const target = index + dir
    if (target < 0 || target >= bestsellers.length) return
    setBestsellers((prev) => {
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    setOrderDirty(true)
  }

  const handleSaveOrder = async () => {
    setSavingOrder(true)
    try {
      const order = bestsellers.map((p) => p._id)
      const { data } = await axios.put('/api/bestseller', { order })
      if (!data.success) throw new Error(data.message)
      showToast('success', data.message)
      setOrderDirty(false)
    } catch (error) {
      showToast('error', error.message)
    } finally {
      setSavingOrder(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        title="Bestsellers"
        description="Curate the products shown in the storefront Bestsellers section."
        breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
      />

      {/* Add products */}
      <div className="rounded-md bg-card p-4 sm:p-6">
        <h3 className="mb-1 text-sm font-semibold">Add products</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Pick from existing products to feature them as bestsellers.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:max-w-md">
            <Select
              options={availableOptions}
              selected={selectedIds}
              setSelected={setSelectedIds}
              isMulti
              placeholder={
                availableOptions.length ? 'Select products' : 'No products available to add'
              }
            />
          </div>
          <ButtonLoading
            loading={adding}
            onClick={handleAdd}
            type="button"
            text={
              <span className="inline-flex items-center gap-2">
                <Plus className="size-4" /> Add Selected
              </span>
            }
            className="h-9"
          />
        </div>
      </div>

      {/* Current bestsellers */}
      <div className="rounded-md bg-card p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Current bestsellers</h3>
            <p className="text-sm text-muted-foreground">
              Reorder with the arrows; lower entries appear later on the storefront.
            </p>
          </div>
          {orderDirty && (
            <ButtonLoading
              loading={savingOrder}
              onClick={handleSaveOrder}
              type="button"
              text="Save Order"
              className="h-9"
            />
          )}
        </div>

        {loadingList ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : bestsellers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <Crown className="size-8 opacity-40" />
            <p className="text-sm">No bestsellers yet. Add products above to get started.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {bestsellers.map((product, index) => {
              const imgSrc = product?.media?.[0]?.secure_url || imgPlaceholder.src
              return (
                <li
                  key={product._id}
                  className="flex items-center gap-3 rounded-md border p-2 sm:p-3"
                >
                  <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                  <span className="w-6 shrink-0 text-center text-sm text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="relative size-12 shrink-0 overflow-hidden rounded border bg-muted">
                    <Image src={imgSrc} alt={product.name} fill className="object-cover" sizes="48px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{formatPrice(product.sellingPrice)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      aria-label="Move up"
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={index === bestsellers.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label="Move down"
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8 text-red-600 hover:text-red-700"
                      disabled={removingId === product._id}
                      onClick={() => handleRemove(product._id)}
                      aria-label="Remove from bestsellers"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default ShowBestseller
