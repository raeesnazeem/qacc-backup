process.on('unhandledRejection', (reason) => {
  console.error("Unhandled Rejection:", reason.message);
});
const p1 = new Promise((_, rej) => setTimeout(() => rej(new Error("1")), 10));
const p2 = new Promise((_, rej) => setTimeout(() => rej(new Error("2")), 50));
Promise.all([p1, p2]).catch(e => console.log("Caught:", e.message));
setTimeout(() => console.log("Done"), 100);
