export default function Button({ children, variant = 'primary', ...props }) {
  const cls = variant === 'ghost' ? 'btn ghost' : variant === 'secondary' ? 'btn secondary' : 'btn'
  return (
    <button className={cls} {...props}>{children}</button>
  )
}


