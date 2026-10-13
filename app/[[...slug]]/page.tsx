import DcrsApp from "../../components/DcrsApp";

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params;
  return <DcrsApp initialPath={`/${slug.join("/")}`} />;
}
