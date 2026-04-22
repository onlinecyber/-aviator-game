import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

/* ── Deposit steps ── */
const DEPOSIT_STEPS = ['amount', 'pay', 'confirm']
const UPI_METHODS   = [
  { id: 'gpay',    label: 'Google Pay',  icon: '🎯' },
  { id: 'phonepe', label: 'PhonePe',     icon: '💜' },
  { id: 'paytm',   label: 'Paytm',       icon: '🔵' },
  { id: 'upi',     label: 'UPI / Other', icon: '📱' },
]
const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000, 10000]

/* ══════════════════════════════════════════════
   DEPOSIT PANEL
═══════════════════════════════════════════════ */
const DepositPanel = ({ onSuccess }) => {
  const [step, setStep]       = useState('amount')  // amount → pay → confirm
  const [amount, setAmount]   = useState('')
  const [method, setMethod]   = useState('gpay')
  const [upiInfo, setUpiInfo] = useState(null)
  const [utr, setUtr]         = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/api/wallet/deposit/info').then(r => setUpiInfo(r.data)).catch(() => {})
  }, [])

  const handlePay = () => {
    if (!amount || parseFloat(amount) < 10)
      return toast.error('Minimum deposit ₹10')
    setStep('pay')
  }

  const handleSubmitUTR = async () => {
    if (!utr || utr.trim().length < 6)
      return toast.error('Please enter a valid UTR / Transaction ID')
    setLoading(true)
    try {
      await api.post('/api/wallet/deposit/request', {
        amount: parseFloat(amount),
        utrNumber: utr.trim(),
        paymentMethod: METHODS_MAP[method] || 'UPI',
      })
      setStep('confirm')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const METHODS_MAP = { gpay: 'Google Pay', phonepe: 'PhonePe', paytm: 'Paytm', upi: 'UPI' }

  const upiLink = upiInfo
    ? `upi://pay?pa=${upiInfo.upiId}&pn=${encodeURIComponent(upiInfo.name)}&am=${amount}&cu=INR`
    : '#'

  return (
    <div style={{ padding: '0' }}>
      <AnimatePresence mode="wait">

        {/* ── STEP 1: Enter Amount ── */}
        {step === 'amount' && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

            <p style={label}>Enter deposit amount</p>
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <span style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)',
                color:'#ffd700', fontWeight:800, fontSize:'18px' }}>₹</span>
              <input
                type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="Enter amount" min="10"
                style={{ ...inputStyle, paddingLeft:'36px', fontSize:'20px', fontWeight:800 }}
              />
            </div>

            {/* Quick amounts */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'16px' }}>
              {QUICK_AMOUNTS.map(v => (
                <button key={v} onClick={() => setAmount(String(v))}
                  style={{
                    ...chipStyle,
                    background: parseFloat(amount) === v ? 'rgba(46,204,64,0.2)' : 'rgba(255,255,255,0.05)',
                    color: parseFloat(amount) === v ? '#2ecc40' : 'rgba(255,255,255,0.7)',
                    border: `1px solid ${parseFloat(amount) === v ? 'rgba(46,204,64,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  }}>
                  ₹{v.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Payment method */}
            <p style={label}>Choose payment method</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'8px', marginBottom:'18px' }}>
              {UPI_METHODS.map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  style={{
                    ...chipStyle, padding:'10px 8px', display:'flex', alignItems:'center', gap:'8px',
                    background: method === m.id ? 'rgba(46,204,64,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${method === m.id ? 'rgba(46,204,64,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    color: method === m.id ? '#2ecc40' : 'rgba(255,255,255,0.7)',
                  }}>
                  <span style={{ fontSize:'18px' }}>{m.icon}</span>
                  <span style={{ fontSize:'12px', fontWeight:600 }}>{m.label}</span>
                </button>
              ))}
            </div>

            <button onClick={handlePay} style={greenBtn}>
              Continue to Pay ₹{parseFloat(amount || 0).toLocaleString('en-IN')}
            </button>

            {/* Info box */}
            <div style={infoBox}>
              <span style={{ fontSize:'14px' }}>ℹ️</span>
              <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.5)' }}>
                Amount credited within <b style={{color:'#ffd700'}}>30 minutes</b> after payment verification
              </span>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Pay & Submit UTR ── */}
        {step === 'pay' && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

            {/* Amount badge */}
            <div style={{ textAlign:'center', marginBottom:'14px' }}>
              <div style={{ fontSize:'28px', fontWeight:900, color:'#2ecc40' }}>
                ₹{parseFloat(amount).toLocaleString('en-IN')}
              </div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'12px' }}>via {METHODS_MAP[method]}</div>
            </div>

            {/* UPI details card */}
            {upiInfo && (
              <div style={{
                background:'rgba(255,255,255,0.04)', borderRadius:'14px',
                border:'1px solid rgba(255,255,255,0.08)', padding:'16px', marginBottom:'16px',
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                  <span style={{ color:'rgba(255,255,255,0.5)', fontSize:'11px', fontWeight:600, letterSpacing:'1px' }}>PAY TO</span>
                  <span style={{ background:'rgba(46,204,64,0.12)', color:'#2ecc40', fontSize:'10px',
                    fontWeight:700, padding:'2px 8px', borderRadius:'20px', border:'1px solid rgba(46,204,64,0.3)' }}>
                    VERIFIED
                  </span>
                </div>
                <div style={{ fontSize:'16px', color:'#fff', fontWeight:700, marginBottom:'4px' }}>{upiInfo.name}</div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <code style={{ fontSize:'15px', color:'#2ecc40', fontWeight:800, background:'rgba(46,204,64,0.08)',
                    padding:'4px 10px', borderRadius:'8px', border:'1px solid rgba(46,204,64,0.2)' }}>
                    {upiInfo.upiId}
                  </code>
                  <button onClick={() => { navigator.clipboard.writeText(upiInfo.upiId); toast.success('UPI ID Copied!') }}
                    style={{ background:'transparent', border:'none', color:'#2ecc40', cursor:'pointer', fontSize:'16px', padding:'4px' }}>
                    📋
                  </button>
                </div>
              </div>
            )}

            {/* Open in app button */}
            <a href={upiLink} style={{ ...greenBtn, display:'block', textAlign:'center', textDecoration:'none', marginBottom:'14px' }}>
              📱 Open {METHODS_MAP[method]} App
            </a>

            <div style={divider}><span>After paying, enter UTR below</span></div>

            {/* UTR input */}
            <div style={{ marginTop:'14px' }}>
              <p style={label}>UTR / Transaction ID <span style={{color:'#ff5252'}}>*</span></p>
              <input
                type="text" value={utr} onChange={e => setUtr(e.target.value)}
                placeholder="12-digit UTR number (e.g. 407123456789)"
                style={inputStyle}
              />
              <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', marginTop:'4px' }}>
                Find UTR in your payment app → Transaction history → Copy UTR/Ref number
              </p>
            </div>

            <div style={{ display:'flex', gap:'10px', marginTop:'14px' }}>
              <button onClick={() => setStep('amount')} style={greyBtn}>← Back</button>
              <button onClick={handleSubmitUTR} disabled={loading} style={{ ...greenBtn, flex:1 }}>
                {loading ? '⏳ Submitting...' : '✅ Submit & Verify'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: Confirmation ── */}
        {step === 'confirm' && (
          <motion.div key="s3" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:'56px', marginBottom:'12px' }}>✅</div>
            <h3 style={{ color:'#2ecc40', fontWeight:800, fontSize:'18px', margin:'0 0 6px' }}>
              Request Submitted!
            </h3>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'13px', margin:'0 0 6px' }}>
              Amount: <b style={{color:'#fff'}}>₹{parseFloat(amount).toLocaleString('en-IN')}</b>
            </p>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'13px', margin:'0 0 4px' }}>
              UTR: <b style={{color:'#ffd700'}}>{utr}</b>
            </p>
            <div style={{ ...infoBox, marginTop:'16px', justifyContent:'center' }}>
              <span style={{fontSize:'13px', color:'rgba(255,255,255,0.5)'}}>
                ⏱ Money will be credited within <b style={{color:'#ffd700'}}>30 minutes</b>
              </span>
            </div>
            <button onClick={() => { setStep('amount'); setAmount(''); setUtr(''); onSuccess?.() }}
              style={{ ...greenBtn, marginTop:'16px' }}>
              Done
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

/* ══════════════════════════════════════════════
   WITHDRAW PANEL
═══════════════════════════════════════════════ */
const WithdrawPanel = ({ userBalance, onSuccess }) => {
  const [wMethod, setWMethod] = useState('upi')  // 'upi' | 'bank'
  const [amount, setAmount]   = useState('')
  const [form, setForm]       = useState({
    upiId: '', bankAccount: '', bankIfsc: '', bankName: '', accountHolder: '',
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) < 50) return toast.error('Minimum withdrawal ₹50')
    if (parseFloat(amount) > userBalance)   return toast.error('Insufficient balance')

    setLoading(true)
    try {
      await api.post('/api/wallet/withdraw/request', {
        amount: parseFloat(amount),
        withdrawMethod: wMethod,
        ...form,
      })
      setDone(true)
      onSuccess?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} style={{ textAlign:'center', padding:'24px 0' }}>
      <div style={{ fontSize:'52px', marginBottom:'12px' }}>🎉</div>
      <h3 style={{ color:'#2ecc40', fontWeight:800, fontSize:'18px', margin:'0 0 6px' }}>Withdrawal Requested!</h3>
      <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'13px' }}>
        ₹{parseFloat(amount).toLocaleString('en-IN')} will be sent to your {wMethod === 'upi' ? 'UPI' : 'bank account'}<br/>
        within <b style={{color:'#ffd700'}}>24 hours</b>
      </p>
      <button onClick={() => { setDone(false); setAmount(''); setForm({ upiId:'', bankAccount:'', bankIfsc:'', bankName:'', accountHolder:'' }) }}
        style={{ ...greenBtn, marginTop:'16px' }}>Done</button>
    </motion.div>
  )

  return (
    <div>
      {/* Balance */}
      <div style={{ textAlign:'center', background:'rgba(255,215,0,0.06)', border:'1px solid rgba(255,215,0,0.2)',
        borderRadius:'12px', padding:'12px', marginBottom:'16px' }}>
        <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'11px' }}>Available Balance</div>
        <div style={{ color:'#ffd700', fontWeight:900, fontSize:'24px' }}>₹{(userBalance||0).toLocaleString('en-IN')}</div>
      </div>

      {/* Amount */}
      <p style={label}>Withdrawal Amount</p>
      <div style={{ position:'relative', marginBottom:'14px' }}>
        <span style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)',
          color:'#ffd700', fontWeight:800, fontSize:'18px' }}>₹</span>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="Min ₹50" min="50"
          style={{ ...inputStyle, paddingLeft:'36px', fontSize:'18px', fontWeight:700 }} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'6px', marginBottom:'16px' }}>
        {[100,500,1000,5000].map(v => (
          <button key={v} onClick={() => setAmount(String(Math.min(v, userBalance)))}
            style={{ ...chipStyle, fontSize:'11px', padding:'7px 4px',
              background: parseFloat(amount)===v ? 'rgba(46,204,64,0.15)' : 'rgba(255,255,255,0.04)',
              color: parseFloat(amount)===v ? '#2ecc40' : 'rgba(255,255,255,0.6)',
              border: `1px solid ${parseFloat(amount)===v ? 'rgba(46,204,64,0.4)' : 'rgba(255,255,255,0.08)'}`,
            }}>₹{v.toLocaleString()}</button>
        ))}
      </div>

      {/* Method toggle */}
      <p style={label}>Withdrawal Method</p>
      <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
        {[{id:'upi',label:'📱 UPI'},{id:'bank',label:'🏦 Bank Transfer'}].map(m => (
          <button key={m.id} onClick={() => setWMethod(m.id)}
            style={{ flex:1, padding:'10px',borderRadius:'10px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'13px',
              background: wMethod===m.id ? 'rgba(46,204,64,0.18)' : 'rgba(255,255,255,0.05)',
              color: wMethod===m.id ? '#2ecc40' : 'rgba(255,255,255,0.5)',
              outline: wMethod===m.id ? '2px solid rgba(46,204,64,0.5)' : '2px solid transparent',
            }}>{m.label}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* UPI form */}
        {wMethod === 'upi' && (
          <motion.div key="upi" initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}>
            <p style={label}>Your UPI ID <span style={{color:'#ff5252'}}>*</span></p>
            <input type="text" value={form.upiId}
              onChange={e => setForm({...form, upiId: e.target.value})}
              placeholder="yourname@paytm / @okaxis / @ybl"
              style={{ ...inputStyle, marginBottom:'8px' }} />
            <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)' }}>
              Enter the UPI ID linked to your bank account
            </p>
          </motion.div>
        )}

        {/* Bank form */}
        {wMethod === 'bank' && (
          <motion.div key="bank" initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
            style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <div>
              <p style={label}>Account Holder Name <span style={{color:'#ff5252'}}>*</span></p>
              <input type="text" value={form.accountHolder}
                onChange={e => setForm({...form, accountHolder: e.target.value})}
                placeholder="Full name as per bank" style={inputStyle} />
            </div>
            <div>
              <p style={label}>Bank Account Number <span style={{color:'#ff5252'}}>*</span></p>
              <input type="text" value={form.bankAccount}
                onChange={e => setForm({...form, bankAccount: e.target.value})}
                placeholder="Enter account number" style={inputStyle} />
            </div>
            <div>
              <p style={label}>IFSC Code <span style={{color:'#ff5252'}}>*</span></p>
              <input type="text" value={form.bankIfsc}
                onChange={e => setForm({...form, bankIfsc: e.target.value.toUpperCase()})}
                placeholder="e.g. SBIN0001234" style={inputStyle} />
            </div>
            <div>
              <p style={label}>Bank Name</p>
              <input type="text" value={form.bankName}
                onChange={e => setForm({...form, bankName: e.target.value})}
                placeholder="State Bank / HDFC / ICICI..." style={inputStyle} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={handleSubmit} disabled={loading} style={{ ...greenBtn, marginTop:'18px' }}>
        {loading ? '⏳ Processing...' : `🏦 Request Withdrawal ₹${parseFloat(amount||0).toLocaleString('en-IN')}`}
      </button>

      <div style={infoBox}>
        <span style={{fontSize:'13px'}}>⚠️</span>
        <span style={{fontSize:'11px', color:'rgba(255,255,255,0.4)'}}>
          Amount will be deducted immediately. Transfer within <b style={{color:'#ffd700'}}>24 hours</b> after admin approval.
        </span>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   TRANSACTION HISTORY
═══════════════════════════════════════════════ */
const statusColor = { pending:'#ffd700', completed:'#2ecc40', failed:'#ff5252', rejected:'#ff5252' }
const statusIcon  = { pending:'⏳', completed:'✅', failed:'❌', rejected:'❌' }

const TxHistory = () => {
  const [txns, setTxns]     = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]     = useState(1)
  const [pages, setPages]   = useState(1)

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const r = await api.get(`/api/wallet/transactions?page=${p}&limit=15`)
      setTxns(r.data.transactions || [])
      setPages(r.data.pages || 1)
      setPage(p)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load(1) }, [])

  const typeColor = { deposit:'#2ecc40', withdraw:'#e53935', bet:'#ffd700', win:'#00e5ff', refund:'#cc44ff' }
  const typeIcon  = { deposit:'⬆️', withdraw:'⬇️', bet:'🎮', win:'🏆', refund:'↩️' }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
        <span style={{ color:'rgba(255,255,255,0.7)', fontWeight:700, fontSize:'14px' }}>Transaction History</span>
        <button onClick={() => load(1)} style={{ background:'transparent', border:'none', color:'#2ecc40', cursor:'pointer', fontSize:'12px' }}>
          ↺ Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'30px', color:'rgba(255,255,255,0.3)' }}>Loading...</div>
      ) : txns.length === 0 ? (
        <div style={{ textAlign:'center', padding:'30px', color:'rgba(255,255,255,0.2)', fontSize:'13px' }}>
          No transactions yet
        </div>
      ) : (
        txns.map(tx => (
          <div key={tx._id} style={{
            display:'flex', alignItems:'center', gap:'10px',
            padding:'11px 0', borderBottom:'1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{ width:'34px', height:'34px', borderRadius:'50%', flexShrink:0,
              background: `${typeColor[tx.type]}18`, border:`1px solid ${typeColor[tx.type]}30`,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>
              {typeIcon[tx.type]}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:'rgba(255,255,255,0.8)', fontSize:'12px', fontWeight:600, textTransform:'capitalize' }}>
                {tx.type} {tx.utrNumber ? `· UTR: ${tx.utrNumber}` : ''}
              </div>
              <div style={{ color:'rgba(255,255,255,0.3)', fontSize:'10px', marginTop:'2px' }}>
                {new Date(tx.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
              </div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontWeight:800, fontSize:'13px', color: tx.amount > 0 ? '#2ecc40' : '#e53935' }}>
                {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize:'10px', color: statusColor[tx.status], marginTop:'2px' }}>
                {statusIcon[tx.status]} {tx.status}
              </div>
            </div>
          </div>
        ))
      )}

      {pages > 1 && (
        <div style={{ display:'flex', justifyContent:'center', gap:'12px', marginTop:'12px' }}>
          <button onClick={() => load(page-1)} disabled={page===1}
            style={{ ...greyBtn, opacity: page===1 ? 0.3 : 1 }}>← Prev</button>
          <span style={{ color:'rgba(255,255,255,0.4)', fontSize:'12px', alignSelf:'center' }}>{page}/{pages}</span>
          <button onClick={() => load(page+1)} disabled={page===pages}
            style={{ ...greyBtn, opacity: page===pages ? 0.3 : 1 }}>Next →</button>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN WALLET PAGE
═══════════════════════════════════════════════ */
const WalletPage = () => {
  const { user, fetchMe } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('deposit')

  return (
    <div style={{ maxWidth:'460px', margin:'0 auto', padding:'0 0 60px', background:'#0d1117', minHeight:'100vh' }}>

      {/* ── Back header ── */}
      <div style={{
        display:'flex', alignItems:'center', gap:'10px',
        padding:'14px 14px 10px',
        position:'sticky', top:0, zIndex:20,
        background:'rgba(13,17,23,0.97)',
        backdropFilter:'blur(10px)',
        borderBottom:'1px solid rgba(255,255,255,0.05)',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width:'36px', height:'36px', borderRadius:'50%',
            background:'rgba(255,255,255,0.08)',
            border:'1px solid rgba(255,255,255,0.12)',
            color:'#ffffff', fontSize:'18px', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0,
          }}
        >
          ←
        </button>
        <span style={{ color:'#ffffff', fontWeight:800, fontSize:'17px' }}>Wallet</span>
        <div style={{ flex:1 }} />
        <span style={{ color:'#ffd700', fontWeight:800, fontSize:'15px' }}>
          ₹{(user?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits:0 })}
        </span>
      </div>

      <div style={{ padding:'14px' }}>


      {/* Balance card */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
        style={{
          background:'linear-gradient(135deg, #1a2235 0%, #141824 100%)',
          borderRadius:'20px', padding:'20px', marginBottom:'18px',
          border:'1px solid rgba(255,255,255,0.07)',
          boxShadow:'0 8px 30px rgba(0,0,0,0.4)',
        }}>
        <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'12px', margin:'0 0 4px', letterSpacing:'1px' }}>
          TOTAL BALANCE
        </p>
        <div style={{ fontSize:'36px', fontWeight:900, color:'#ffffff', margin:'0 0 16px',
          textShadow:'0 2px 20px rgba(255,255,255,0.1)' }}>
          ₹{(user?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits:2 })}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
          <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:'12px', padding:'10px 12px' }}>
            <div style={{ color:'rgba(255,255,255,0.3)', fontSize:'10px', letterSpacing:'1px' }}>TOTAL WON</div>
            <div style={{ color:'#2ecc40', fontWeight:800, fontSize:'16px', marginTop:'2px' }}>
              ₹{(user?.totalWon || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:'12px', padding:'10px 12px' }}>
            <div style={{ color:'rgba(255,255,255,0.3)', fontSize:'10px', letterSpacing:'1px' }}>TOTAL BETS</div>
            <div style={{ color:'#ffd700', fontWeight:800, fontSize:'16px', marginTop:'2px' }}>
              {user?.totalBets || 0}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab switcher */}
      <div style={{ display:'flex', background:'rgba(255,255,255,0.04)', borderRadius:'16px',
        padding:'4px', marginBottom:'18px', border:'1px solid rgba(255,255,255,0.06)' }}>
        {[{id:'deposit',label:'⬆️ Deposit'},{id:'withdraw',label:'⬇️ Withdraw'},{id:'history',label:'📋 History'}].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ flex:1, padding:'10px 4px', border:'none', borderRadius:'12px', cursor:'pointer',
              fontSize:'12px', fontWeight:700, transition:'all 0.2s',
              background: activeTab===t.id ? (t.id==='withdraw' ? '#e53935' : t.id==='deposit' ? '#2ecc40' : 'rgba(255,255,255,0.12)') : 'transparent',
              color: activeTab===t.id ? '#fff' : 'rgba(255,255,255,0.4)',
            }}>{t.label}</button>
        ))}
      </div>

      {/* Panel */}
      <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:'18px',
        border:'1px solid rgba(255,255,255,0.06)', padding:'18px' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'deposit' && (
            <motion.div key="dep" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <DepositPanel onSuccess={fetchMe} />
            </motion.div>
          )}
          {activeTab === 'withdraw' && (
            <motion.div key="with" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <WithdrawPanel userBalance={user?.balance || 0} onSuccess={fetchMe} />
            </motion.div>
          )}
          {activeTab === 'history' && (
            <motion.div key="hist" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <TxHistory />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>  {/* inner padding div */}
    </div>
  )
}

export default WalletPage

/* ── Shared styles ── */
const label = { color:'rgba(255,255,255,0.55)', fontSize:'11px', fontWeight:600,
  letterSpacing:'0.5px', margin:'0 0 6px', textTransform:'uppercase' }

const inputStyle = {
  width:'100%', background:'rgba(0,0,0,0.35)',
  border:'1px solid rgba(255,255,255,0.12)', borderRadius:'12px',
  color:'#fff', fontSize:'15px', padding:'12px 14px',
  outline:'none', fontFamily:'inherit', boxSizing:'border-box',
}

const chipStyle = {
  borderRadius:'10px', border:'none', cursor:'pointer',
  padding:'9px 6px', fontWeight:600, fontSize:'13px',
  transition:'all 0.15s',
}

const greenBtn = {
  width:'100%', padding:'14px', borderRadius:'14px', border:'none',
  background:'linear-gradient(135deg,#27ae36,#2ecc40)',
  color:'#fff', fontWeight:800, fontSize:'15px',
  cursor:'pointer', boxShadow:'0 4px 20px rgba(46,204,64,0.35)',
  letterSpacing:'0.5px', transition:'all 0.2s',
}

const greyBtn = {
  padding:'10px 18px', borderRadius:'10px',
  border:'1px solid rgba(255,255,255,0.2)',
  background:'rgba(255,255,255,0.1)',
  color:'rgba(255,255,255,0.85)',
  cursor:'pointer', fontSize:'13px', fontWeight:700,
}

const infoBox = {
  display:'flex', alignItems:'flex-start', gap:'8px',
  background:'rgba(255,255,255,0.03)', borderRadius:'10px',
  padding:'10px 12px', marginTop:'12px',
  border:'1px solid rgba(255,255,255,0.06)',
}

const divider = {
  display:'flex', alignItems:'center', gap:'10px', margin:'14px 0 0',
  color:'rgba(255,255,255,0.3)', fontSize:'11px',
}
