import { NextResponse } from 'next/server';
import { EventEntity, MessageEntity } from '@/lib/models';

// just need this in for now, should remove when fully in production
export async function POST() {
  // Require an API key authentication
  const req = arguments[0];
  let providedKey = undefined;
  if (req && req.headers && typeof req.headers.get === 'function') {
    providedKey = req.headers.get('x-api-key');
  }
  const NUKE_API_KEY = 'clearingDAta1123';
  if (!providedKey || providedKey !== NUKE_API_KEY) {
    return NextResponse.json(
      { error: 'Unauthorized: missing or invalid API key' },
      { status: 401 }
    );
  }

  try {
    // Scan and delete all Events
    const eventScanResult = await EventEntity.scan.go();
    const events = eventScanResult.data || [];

    const eventDeletePromises = events.map(({ id }) => {
      if (!id) return Promise.resolve();
      return EventEntity.delete({ id: id }).go();
    });

    // Scan and delete all Messages
    const messageScanResult = await MessageEntity.scan.go();
    const messages = messageScanResult.data || [];

    // MessageEntity requires both id and eventId for deletion
    const messageDeletePromises = messages.map(message => {
      if (!message.id || !message.event_id) return Promise.resolve();
      return MessageEntity.delete({
        event_id: message.event_id,
        id: message.id,
        created_at: message.created_at,
      }).go();
    });

    await Promise.all([...eventDeletePromises, ...messageDeletePromises]);

    return NextResponse.json({
      message: `Deleted ${events.length} events and ${messages.length} messages.`,
    });
  } catch (error: any) {
    console.error('[nuke] Error nuking tables:', error);
    return NextResponse.json(
      { error: 'Failed to nuke tables', details: error.message },
      { status: 500 }
    );
  }
}
