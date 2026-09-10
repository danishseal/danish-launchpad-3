import { StructuresDirectory } from "@/components/fourthstreet/structures-directory";

export const metadata = {
  title: "Structures",
  description:
    "The seventeen market structures a 4thstreet launch can install, and what each one argues about how markets behave.",
};

export default function StructuresPage() {
  return <StructuresDirectory />;
}
