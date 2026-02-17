export async function onRequestGet(context) {
  return new Response("PING OK", { status: 200 });
}
