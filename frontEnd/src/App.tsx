import { useState } from "react"
import { QRCode } from "react-qr-code"
import qrcode from "qrcode"
import { useUrlList } from "./hooks/useUrlList"
import { shortenUrlRequest } from "./services/urlService"

const App = () => {
  const [url, setUrl] = useState<string>("")
  const [shortUrl, setShortUrl] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<boolean>(false)
  const [qrCode, setQrCode] = useState<string>("")
  const {
    links,
    listLoading,
    listError,
    searchQuery,
    filteredLinks,
    paginatedLinks,
    activePage,
    totalPages,
    setSearch,
    goToPreviousPage,
    goToNextPage,
    refreshLinks,
  } = useUrlList()

  const handleShorten = async () => {
    if (!url) return

    setLoading(true)
    setError(null)
    try {
      const newShortUrl = await shortenUrlRequest(url)
      setShortUrl(newShortUrl)
      setCopied(false)

      const dataUrl = await qrcode.toDataURL(newShortUrl)
      setQrCode(dataUrl)

      await refreshLinks()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shortUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 6000)
  }

  const formatDate = (iso?: string) => {
    if (!iso) return "—"
    try {
      return new Date(iso).toLocaleString()
    } catch {
      return "—"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">
        URL Shortener
      </h1>

      <div className="flex flex-col gap-4 w-full max-w-4xl">
        <div className="flex flex-col gap-4">
          <input
            type="text"
            className="input input-success w-full"
            placeholder="Enter your URL to shorten"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary w-full sm:w-auto"
            disabled={loading}
            onClick={() => void handleShorten()}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Shorten"
            )}
          </button>
        </div>

        {error && (
          <div role="alert" className="alert alert-error text-sm">
            {error}
          </div>
        )}

        {shortUrl && (
          <div className="flex flex-col items-stretch rounded-lg border border-base-200 bg-base-100 p-4 shadow-sm">
            <p className="font-medium mb-2 text-gray-800">Shortened URL</p>
            <a href={shortUrl} className="link link-primary break-all mb-3">
              {shortUrl}
            </a>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className={`btn w-full sm:w-auto ${copied ? "btn-success" : "btn-secondary"}`}
            >
              {copied ? "Copied" : "Copy"}
            </button>

            <div className="bg-white p-4 rounded-lg shadow mt-6 self-center">
              <p className="mb-3 text-center font-semibold text-gray-700">
                Scan QR Code
              </p>
              <QRCode value={shortUrl} size={180} />
            </div>
            {qrCode && (
              <a
                className="btn btn-accent mt-3 w-full"
                download="qr-code.png"
                href={qrCode}
              >
                Download QR
              </a>
            )}
          </div>
        )}

        <div className="mt-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            All shortened links
          </h2>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Search by original URL or short link"
              value={searchQuery}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="text-sm text-gray-600 whitespace-nowrap">
              Showing {filteredLinks.length} of {links.length}
            </div>
          </div>

          {listError && (
            <div role="alert" className="alert alert-warning text-sm mb-3">
              {listError}
            </div>
          )}

          {listLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-lg loading-spinner text-primary" />
            </div>
          ) : filteredLinks.length === 0 ? (
            <p className="text-gray-600 text-center py-8 bg-base-100 rounded-lg border border-base-200">
              No matching URLs found.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-lg border border-base-200 bg-base-100 shadow-sm">
                <table className="table table-zebra table-sm md:table-md">
                  <thead>
                    <tr>
                      <th>Original</th>
                      <th>Short link</th>
                      <th className="text-right">Clicks</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLinks.map((row) => (
                      <tr key={row._id}>
                        <td className="max-w-[12rem] md:max-w-xs">
                          <a
                            href={row.fullUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="link link-hover break-all line-clamp-2"
                            title={row.fullUrl}
                          >
                            {row.fullUrl}
                          </a>
                        </td>
                        <td className="max-w-[10rem] md:max-w-sm">
                          <a
                            href={row.shortURL}
                            className="link link-primary break-all"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {row.shortURL}
                          </a>
                        </td>
                        <td className="text-right font-mono">{row.clicks}</td>
                        <td className="whitespace-nowrap text-sm text-gray-600">
                          {formatDate(row.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Page {activePage} of {totalPages}
                </p>
                <div className="join">
                  <button
                    type="button"
                    className="btn btn-sm join-item"
                    disabled={activePage <= 1}
                    onClick={goToPreviousPage}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm join-item"
                    disabled={activePage >= totalPages}
                    onClick={goToNextPage}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
