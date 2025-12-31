export interface Insulator {
  id: number;
  insulator_name: string;
  insulator_description: string;
  image_key: string | null;
  image_url: string | null;
  thermal_conductivity: number;
}