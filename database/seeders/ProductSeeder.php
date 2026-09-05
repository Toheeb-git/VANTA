<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Product;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */

public function run(): void
{
    for ($i = 0; $i < 10; $i++) {

        $name = fake()->words(3, true);

        Product::create([
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'price' => fake()->randomFloat(2, 10, 500),
            'discount_price' => null,
            'stock' => fake()->numberBetween(0, 100),
            'image' => null,
            'is_active' => true,
        ]);
    }
}
}
