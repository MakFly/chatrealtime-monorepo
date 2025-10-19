<?php

declare(strict_types=1);

namespace App\Tests;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

abstract class TestCase extends WebTestCase
{
    protected ?KernelBrowser $client = null;

    public function client(): KernelBrowser
    {
        if ($this->client === null) {
            $this->client = static::createClient();
        }

        return $this->client;
    }

    public function withHeader(string $name, string $value): self
    {
        $this->client()->setServerParameter(
            'HTTP_' . strtoupper(str_replace('-', '_', $name)),
            $value
        );

        return $this;
    }
}
