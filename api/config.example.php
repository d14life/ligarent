<?php
/* Copy this to api/config.php and fill it in. NEVER commit config.php. */
return [
    // From @BotFather. Looks like 1234567890:AAH...  Keep it secret.
    'bot_token' => 'PUT-YOUR-BOT-TOKEN-HERE',

    // Numeric chat id the enquiries should land in. See api/README.md step 3.
    'chat_id'   => 'PUT-YOUR-CHAT-ID-HERE',

    // Lock this to your live site once deployed, e.g. 'https://ligarent.com'.
    'allowed_origin' => '*',
];
