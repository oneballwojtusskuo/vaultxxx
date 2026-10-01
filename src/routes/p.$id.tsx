import { createFileRoute, redirect } from "@tanstack/react-router";

// Short, shareable product link: /p/<id> → /product/<id>
export const Route = createFileRoute("/p/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/product/$id", params: { id: params.id }, statusCode: 301 });
  },
});
