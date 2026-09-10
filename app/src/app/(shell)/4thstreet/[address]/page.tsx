import { FourthStreetToken } from "@/components/fourthstreet/token-view";

export default async function FourthStreetTokenPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  return <FourthStreetToken address={address} />;
}
