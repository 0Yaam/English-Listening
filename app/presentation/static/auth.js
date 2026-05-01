const ACCESS_TOKEN_STORAGE_KEY = "shadowing_access_token"

const getAccessToken = () => {
  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
}

const setAccessToken = (token) => {
  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token)
}

const clearAccessToken = () => {
  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
}

const redirectToLogin = () => {
  window.location.href = "/login"
}

const redirectToProfile = () => {
  window.location.href = "/profile"
}

const buildApiUrl = (path) => {
  return path.startsWith("http") ? path : `${window.location.origin}${path}`
}

const extractErrorMessage = async (response) => {
  try {
    const payload = await response.json()
    if (typeof payload?.message === "string" && payload.message.length > 0) {
      return payload.message
    }
    if (typeof payload?.detail === "string" && payload.detail.length > 0) {
      return payload.detail
    }
  } catch {
    return `Request failed with status ${response.status}.`
  }

  return `Request failed with status ${response.status}.`
}

const apiFetch = async (path, options = {}) => {
  const token = getAccessToken()
  const headers = new Headers(options.headers ?? {})

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json")
  }
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers,
  })

  if (response.status === 401) {
    clearAccessToken()
    redirectToLogin()
    throw new Error("Your session has expired. Please sign in again.")
  }

  return response
}

const bootAuthPage = () => {
  const authPage = document.body.dataset.authPage
  if (!authPage) {
    return
  }

  if (getAccessToken()) {
    redirectToProfile()
    return
  }

  const form = document.getElementById("auth-form")
  const submitButton = document.getElementById("auth-submit")
  const errorMessage = document.getElementById("auth-error")
  const infoMessage = document.getElementById("auth-info")

  const setError = (message) => {
    if (!message) {
      errorMessage.hidden = true
      errorMessage.textContent = ""
      return
    }

    errorMessage.hidden = false
    errorMessage.textContent = message
  }

  const setInfo = (message) => {
    if (!message) {
      infoMessage.hidden = true
      infoMessage.textContent = ""
      return
    }

    infoMessage.hidden = false
    infoMessage.textContent = message
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault()
    setError("")
    setInfo("")

    const formData = new FormData(form)
    const endpoint = authPage === "register" ? "/api/v1/auth/register" : "/api/v1/auth/login"
    const rawPassword = String(formData.get("password") ?? "")
    const confirmPassword = String(formData.get("confirm_password") ?? "")
    if (authPage === "register") {
      if (rawPassword.length < 8) {
        setError("Password must be at least 8 characters long.")
        return
      }
      if (rawPassword !== confirmPassword) {
        setError("Confirm password must match the password.")
        return
      }
    }

    submitButton.disabled = true
    submitButton.textContent = authPage === "register" ? "Creating account..." : "Signing in..."
    const payload =
      authPage === "register"
        ? {
            username: String(formData.get("username") ?? "").trim(),
            email: String(formData.get("email") ?? "").trim(),
            password: rawPassword,
          }
        : {
            email: String(formData.get("email") ?? "").trim(),
            password: rawPassword,
          }

    try {
      const response = await fetch(buildApiUrl(endpoint), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        setError(await extractErrorMessage(response))
        return
      }

      const result = await response.json()
      setAccessToken(result.access_token)
      setInfo(authPage === "register" ? "Account created. Redirecting..." : "Signed in. Redirecting...")
      window.setTimeout(() => {
        redirectToProfile()
      }, 250)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not complete the request.")
    } finally {
      submitButton.disabled = false
      submitButton.textContent = authPage === "register" ? "Create account" : "Sign in"
    }
  })
}

bootAuthPage()

export {
  ACCESS_TOKEN_STORAGE_KEY,
  apiFetch,
  clearAccessToken,
  extractErrorMessage,
  getAccessToken,
  redirectToLogin,
  redirectToProfile,
  setAccessToken,
}
