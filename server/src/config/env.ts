import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Umgebungsvariable ${name} fehlt. Siehe README.md, Abschnitt "Server lokal starten".`);
  }
  return value;
}

export const env = {
  mongodbUri: required('MONGODB_URI'),
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: required('JWT_SECRET'),
};
