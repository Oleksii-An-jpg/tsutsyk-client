'use server'
import { headers } from 'next/headers';
import { userAgent } from 'next/server'
import Tracker from "@/app/_components/tracker";

export default async function Page() {
    const headersList = await headers()
    const ua = userAgent({ headers: headersList });
    return <Tracker userAgent={ua} />
}
