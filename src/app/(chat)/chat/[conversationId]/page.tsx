import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/modules/auth/token.service";
import { getConversationById } from "@/modules/chat/chat.service";
import { ChatWindow } from "@/components/chat/chat-window";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  let payload;
  try {
    payload = await verifyAccessToken(token);
  } catch {
    redirect("/login");
  }

  const userId = payload.sub;
  const role = payload.role;

  try {
    await getConversationById(conversationId, userId, role);
  } catch {
    redirect("/");
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <ChatWindow conversationId={conversationId} currentUserId={userId} token={token} />
    </div>
  );
}
