import { useEffect, useMemo, useState } from "react"
import { fetchUrlList } from "../services/urlService"
import type { ShortenedEntry } from "../types/url"

const ITEMS_PER_PAGE = 6

export function useUrlList() {
  const [links, setLinks] = useState<ShortenedEntry[]>([])
  const [listLoading, setListLoading] = useState<boolean>(true)
  const [listError, setListError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [currentPage, setCurrentPage] = useState<number>(1)

  useEffect(() => {
    let cancelled = false
    fetchUrlList()
      .then((urls) => {
        if (!cancelled) setLinks(urls)
      })
      .catch(() => {
        if (!cancelled) setListError("Could not load shortened links.")
      })
      .finally(() => {
        if (!cancelled) setListLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const normalizedQuery = searchQuery.trim().toLowerCase()

  const filteredLinks = useMemo(
    () =>
      links.filter((entry) => {
        if (!normalizedQuery) return true
        return (
          entry.fullUrl.toLowerCase().includes(normalizedQuery) ||
          entry.shortURL.toLowerCase().includes(normalizedQuery) ||
          entry.shortID.toLowerCase().includes(normalizedQuery)
        )
      }),
    [links, normalizedQuery],
  )

  const totalPages = Math.max(1, Math.ceil(filteredLinks.length / ITEMS_PER_PAGE))
  const activePage = Math.min(currentPage, totalPages)

  const paginatedLinks = useMemo(() => {
    const startIndex = (activePage - 1) * ITEMS_PER_PAGE
    return filteredLinks.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [activePage, filteredLinks])

  const setSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
  }

  const refreshLinks = async (errorMessage = "Could not refresh the list.") => {
    try {
      setLinks(await fetchUrlList())
      setListError(null)
    } catch {
      setListError(errorMessage)
    }
  }

  return {
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
  }
}
