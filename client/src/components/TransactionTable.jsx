const typeColors = {
  deposit: 'text-brand-accent',
  win:     'text-brand-accent',
  bet:     'text-brand-primary',
  withdraw:'text-brand-gold',
  refund:  'text-brand-blue',
}

const typeIcons = {
  deposit: '⬆️',
  win:     '🏆',
  bet:     '🎰',
  withdraw:'⬇️',
  refund:  '↩️',
}

const TransactionTable = ({ transactions }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12 text-white/30">
        <div className="text-4xl mb-3">📂</div>
        <p>No transactions yet</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-white/40 text-left border-b border-white/5">
            <th className="pb-3 font-medium">Type</th>
            <th className="pb-3 font-medium">Amount</th>
            <th className="pb-3 font-medium hidden sm:table-cell">Balance After</th>
            <th className="pb-3 font-medium hidden md:table-cell">Description</th>
            <th className="pb-3 font-medium text-right">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {transactions.map((tx) => (
            <tr key={tx._id} className="hover:bg-white/2 transition-colors">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <span>{typeIcons[tx.type] || '💳'}</span>
                  <span className={`capitalize font-semibold ${typeColors[tx.type] || 'text-white'}`}>
                    {tx.type}
                  </span>
                </div>
              </td>
              <td className={`py-3 pr-4 font-mono font-bold ${tx.amount >= 0 ? 'text-brand-accent' : 'text-brand-primary'}`}>
                {tx.amount >= 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
              </td>
              <td className="py-3 pr-4 font-mono text-white/60 hidden sm:table-cell">
                ₹{tx.balanceAfter?.toFixed(2)}
              </td>
              <td className="py-3 pr-4 text-white/40 hidden md:table-cell truncate max-w-xs">
                {tx.description}
              </td>
              <td className="py-3 text-right text-white/40 text-xs">
                {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TransactionTable
