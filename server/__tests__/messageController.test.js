'use strict';
/**
 * Unit test for messageController's bumpUnread — a pure function operating
 * on a plain object shaped like a Mongoose document, no DB connection needed.
 *
 * Regression for a real, previously-live bug: `thread.participants` is raw
 * ObjectIds when a thread is freshly created (createThread), but fully
 * populated User documents when sendMessage re-fetches the thread to resolve
 * a reply's recipient (`.populate('participants', ...)`). bumpUnread called
 * `.toString()` on each participant unconditionally — fine for an ObjectId,
 * but a populated Mongoose document's `.toString()` does not return its id.
 * The resulting garbage string then hit `Map.set()`, which Mongoose rejects
 * for keys containing "." — a 500 on every reply to an existing thread,
 * after the message itself had already been saved.
 */

const mongoose = require('mongoose');
const { _bumpUnread: bumpUnread } = require('../controllers/messageController');

// Minimal stand-in for a Mongoose document's Map field — real enough to
// exercise the same key-based get/set the controller uses.
const fakeThread = (participants) => ({
  participants,
  unreadCounts: new Map(),
});

describe('bumpUnread', () => {
  it('bumps unread counts for other participants when participants are raw ObjectIds', async () => {
    const sender = new mongoose.Types.ObjectId();
    const other = new mongoose.Types.ObjectId();
    const thread = fakeThread([sender, other]);

    await bumpUnread(thread, sender);

    expect(thread.unreadCounts.get(other.toString())).toBe(1);
    expect(thread.unreadCounts.has(sender.toString())).toBe(false);
  });

  it('bumps unread counts correctly when participants are populated User documents', async () => {
    const senderId = new mongoose.Types.ObjectId();
    const otherId = new mongoose.Types.ObjectId();
    const sender = { _id: senderId, fullName: 'Sender', email: 'sender@x.com', role: 'USER' };
    const other  = { _id: otherId, fullName: 'Other', email: 'other@x.com', role: 'ADMIN' };
    const thread = fakeThread([sender, other]);

    await bumpUnread(thread, senderId);

    // Regression check: this must be a clean ObjectId-string key, not the
    // populated document's toString() garbage.
    expect(thread.unreadCounts.get(otherId.toString())).toBe(1);
    expect([...thread.unreadCounts.keys()]).toEqual([otherId.toString()]);
  });

  it('handles a mix of populated and unpopulated participants in the same call', async () => {
    const senderId = new mongoose.Types.ObjectId();
    const otherId = new mongoose.Types.ObjectId();
    const populatedOther = { _id: otherId, fullName: 'Other' };
    const thread = fakeThread([senderId, populatedOther]);

    await bumpUnread(thread, senderId);

    expect(thread.unreadCounts.get(otherId.toString())).toBe(1);
  });

  it('increments an existing unread count rather than resetting it', async () => {
    const senderId = new mongoose.Types.ObjectId();
    const otherId = new mongoose.Types.ObjectId();
    const thread = fakeThread([senderId, otherId]);
    thread.unreadCounts.set(otherId.toString(), 3);

    await bumpUnread(thread, senderId);

    expect(thread.unreadCounts.get(otherId.toString())).toBe(4);
  });
});
