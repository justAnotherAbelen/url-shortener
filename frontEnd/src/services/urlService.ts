import axios from "axios"
import type { ShortenedEntry } from "../types/url"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

export async function fetchUrlList(): Promise<ShortenedEntry[]> {
  const res = await axios.get<{ urls: ShortenedEntry[] }>(`${API_URL}/urls`)
  return res.data.urls ?? []
}

export async function shortenUrlRequest(originalUrl: string): Promise<string> {
  const res = await axios.post(`${API_URL}/shortenUrl`, { originalUrl })

  if (res.status !== 201) {
    throw new Error("Failed to shorten URL")
  }

  return res.data.shortURL as string
}
