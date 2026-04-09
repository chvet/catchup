// Clipboard helper — fonctionne dans le navigateur ET dans la WebView Capacitor
// Fallback vers document.execCommand('copy') si navigator.clipboard n'est pas dispo

export async function copyToClipboard(text: string): Promise<boolean> {
  // Méthode 1 : navigator.clipboard (moderne, HTTPS requis)
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fallback si permission refusée (fréquent en WebView)
    }
  }

  // Méthode 2 : execCommand (legacy, fonctionne dans les WebView)
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '-9999px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    textarea.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}
