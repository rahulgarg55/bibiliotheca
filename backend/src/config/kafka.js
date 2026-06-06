import { Kafka } from 'kafkajs';

const kafkaBroker = process.env.KAFKA_BROKER || 'localhost:9092';

const kafka = new Kafka({
  clientId: 'bibliotheca-app',
  brokers: [kafkaBroker],
  retry: {
    initialRetryTime: 300,
    retries: 10
  }
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: 'bibliotheca-group' });

export const connectKafka = async () => {
  let connected = false;
  let attempts = 0;
  
  while (!connected && attempts < 10) {
    try {
      attempts++;
      console.log(`Connecting to Kafka broker at ${kafkaBroker} (attempt ${attempts}/10)...`);
      await producer.connect();
      await consumer.connect();
      connected = true;
      console.log('Successfully connected to Kafka Message Broker');
    } catch (err) {
      console.error(`Kafka Connection attempt ${attempts} failed:`, err.message);
      if (attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5 seconds before retry
      }
    }
  }

  if (!connected) {
    console.error('CRITICAL: Failed to connect to Kafka Broker after 10 attempts.');
  }
};
