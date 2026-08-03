<?php

namespace App\Exceptions;

use RuntimeException;

class BusinessRuleException extends RuntimeException
{
    private $details;

    public function __construct($message, array $details = [])
    {
        parent::__construct($message);
        $this->details = $details;
    }

    public function details()
    {
        return $this->details;
    }
}
