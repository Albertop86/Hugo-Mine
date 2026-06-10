export default function RootNotFound() {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#FEF9EF', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ fontSize: '4rem', fontWeight: 900, color: '#5D7C15', margin: 0 }}>404</p>
          <h1 style={{ color: '#2D1B0E', margin: '0.5rem 0' }}>Page not found</h1>
          <p style={{ color: '#6B4C2A', marginBottom: '2rem' }}>This block doesn't exist in this world.</p>
          <a href="/es" style={{ background: '#5D7C15', color: 'white', padding: '0.75rem 2rem', borderRadius: '1rem', fontWeight: 700, textDecoration: 'none' }}>
            Back to home
          </a>
        </div>
      </body>
    </html>
  )
}
