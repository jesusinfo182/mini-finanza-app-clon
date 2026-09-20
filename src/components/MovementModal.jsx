import { useState } from 'react'
import { X } from 'lucide-react'
import { CATS, fmt, formatAmountTyping, parseAmount, todayLocalISODate } from '../lib/helpers'

export default function MovementModal({ accounts, initial, onClose, onSave, onUpdate, onSaveInstallment, cardBg, border, text, subtext, accent, bg }) {
  const isEditing = !!initial
  const [type, setType] = useState(initial?.type || 'expense')
  const [amount, setAmount] = useState(initial ? formatAmountTyping(String(initial.amount).replace('.', ',')) : '')
  const [category, setCategory] = useState(initial?.category && initial.category !== 'ingreso' ? initial.category : 'necesidades')
  const [accountId, setAccountId] = useState(initial?.accountId || accounts[0]?.id || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [notes, setNotes] = useState(initial?.notes || '')
  const [shared, setShared] = useState(initial?.shared || false)
  const [date, setDate] = useState(initial?.date ? initial.date.slice(0, 10) : todayLocalISODate())
  const [hasInstallment, setHasInstallment] = useState(false)
  const [installmentCount, setInstallmentCount] = useState(2)
  const [isUsd, setIsUsd] = useState(initial?.isUsd || false)
  const [montoUsd, setMontoUsd] = useState(initial?.montoUsd ? formatAmountTyping(String(initial.montoUsd).replace('.', ',')) : '')
  const [cotizacionUsd, setCotizacionUsd] = useState(initial?.cotizacionUsd ? formatAmountTyping(String(initial.cotizacionUsd).replace('.', ',')) : '')
  const [error, setError] = useState('')

  const cuotaAmount = hasInstallment && amount && installmentCount ? parseAmount(amount) / Number(installmentCount) : 0

  function handleSave() {
    setError('')
    if (hasInstallment) {
      const total = parseAmount(amount)
      if (!total || total <= 0) { setError('Ingresá el monto total de la compra.'); return }
      if (!Number(installmentCount) || Number(installmentCount) < 2) { setError('Ingresá una cantidad válida de cuotas (2 o más).'); return }
      if (!accountId) { setError('Seleccioná una cuenta.'); return }
      onSaveInstallment({
        name: description || 'Compra en cuotas', category, accountId,
        totalAmount: total, count: Number(installmentCount), cuotaAmount, notes, shared,
        purchaseDate: date,
      })
      return
    }
    const finalAmount = parseAmount(amount)
    if (!finalAmount || finalAmount <= 0) { setError('Ingresá un monto válido, mayor a $0.'); return }
    if (!accountId) { setError('Seleccioná una cuenta.'); return }
    if (isUsd && (!parseAmount(montoUsd) || !parseAmount(cotizacionUsd))) { setError('Completá el monto en USD y la cotización.'); return }
    const payload = {
      type, amount: finalAmount, category: type === 'expense' ? category : 'ingreso', accountId, description, notes, shared, date,
      isUsd, montoUsd: isUsd ? parseAmount(montoUsd) : null, cotizacionUsd: isUsd ? parseAmount(cotizacionUsd) : null,
    }
    if (isEditing) onUpdate(initial.id, payload)
    else onSave(payload)
  }

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${border}`, background: bg, color: text, fontSize: 14, marginTop: 4, boxSizing: 'border-box' }
  const labelStyle = { fontSize: 12, color: subtext, fontWeight: 600 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'flex-end', zIndex: 70 }} onClick={onClose}>
      <div style={{ background: cardBg, width: '100%', maxHeight: '88vh', overflowY: 'auto', borderRadius: '20px 20px 0 0', padding: 20 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: text }}>{isEditing ? 'Editar movimiento' : 'Nuevo movimiento'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: subtext, cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={() => setType('expense')} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${type === 'expense' ? '#ef4444' : border}`, background: type === 'expense' ? '#ef444422' : 'transparent', color: text, fontWeight: 600, cursor: 'pointer' }}>Gasto</button>
          <button onClick={() => { setType('income'); setHasInstallment(false) }} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${type === 'income' ? '#22c55e' : border}`, background: type === 'income' ? '#22c55e22' : 'transparent', color: text, fontWeight: 600, cursor: 'pointer' }}>Ingreso</button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>{hasInstallment ? 'Monto total de la compra' : 'Monto'}</label>
          <input style={inputStyle} type="text" inputMode="decimal" value={amount} onChange={e => setAmount(formatAmountTyping(e.target.value))} placeholder="0,00" />
        </div>

        {type === 'expense' && !isEditing && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={hasInstallment} onChange={e => setHasInstallment(e.target.checked)} />
              Es una compra en cuotas
            </label>
          </div>
        )}

        {hasInstallment && (
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}># Cuotas</label>
            <input style={inputStyle} type="number" min="2" value={installmentCount} onChange={e => setInstallmentCount(e.target.value)} />
            {cuotaAmount > 0 && (
              <div style={{ fontSize: 13, color: subtext, marginTop: 6 }}>
                Cada cuota: <b style={{ color: text }}>{fmt(cuotaAmount)}</b> — vas a poder ir marcándolas como pagadas mes a mes desde la pantalla principal.
              </div>
            )}
          </div>
        )}

        {!hasInstallment && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={isUsd} onChange={e => setIsUsd(e.target.checked)} />
              Cargar equivalente en dólares
            </label>
          </div>
        )}

        {!hasInstallment && isUsd && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Monto en USD</label>
              <input style={inputStyle} type="text" inputMode="decimal" value={montoUsd} onChange={e => setMontoUsd(formatAmountTyping(e.target.value))} placeholder="0,00" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Cotización</label>
              <input style={inputStyle} type="text" inputMode="decimal" value={cotizacionUsd} onChange={e => setCotizacionUsd(formatAmountTyping(e.target.value))} placeholder="0,00" />
            </div>
          </div>
        )}

        {type === 'expense' && (
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Categoría</label>
            <select style={inputStyle} value={category} onChange={e => setCategory(e.target.value)}>
              {CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Cuenta</label>
          <select style={inputStyle} value={accountId} onChange={e => setAccountId(e.target.value)}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Descripción</label>
          <input style={inputStyle} value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej: Almuerzo, Sueldo..." />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Notas</label>
          <textarea style={{ ...inputStyle, minHeight: 60, resize: 'none' }} value={notes} onChange={e => setNotes(e.target.value.slice(0, 90))} maxLength={90} placeholder="Notas adicionales..." />
          <div style={{ textAlign: 'right', fontSize: 11, color: subtext, marginTop: 2 }}>{90 - notes.length}</div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>{hasInstallment ? 'Fecha de la compra' : 'Fecha'}</label>
          <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        {type === 'expense' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={shared} onChange={e => setShared(e.target.checked)} />
              Gasto compartido
            </label>
          </div>
        )}

        {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12, background: '#ef444422', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}

        <button onClick={handleSave} style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: accent, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
          {isEditing ? 'Guardar cambios' : hasInstallment ? 'Crear compra en cuotas' : 'Guardar movimiento'}
        </button>
      </div>
    </div>
  )
}
