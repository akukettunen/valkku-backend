import { Router, Request, Response } from 'express';

const router: Router = Router();

// POST /webhook - Webhook endpoint that logs request body
router.post('/', async (req: Request, res: Response) => {
  if(!req.headers.authorization) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  if(req.headers.authorization.split(' ')[1] !== process.env['WEBHOOK_SECRET']) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  try {
    console.log('=== Webhook Request Received ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', req.headers);
    console.log('Query Params:', req.query);
    console.log('Body:', req.body);
    console.log('Timestamp:', new Date().toISOString());
    console.log('================================');

    return res.status(200).json({
      success: true,
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString(),
      receivedData: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
        body: req.body
      }
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error in webhook handler'
    });
  }
});

export default router;
