import { Router, Request, Response } from 'express';

const router: Router = Router();

// PUT /bootstrap - Bootstrap endpoint that logs request body
router.put('/', async (req: Request, res: Response) => {
  try {
    console.log('=== Bootstrap Request Received ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', req.headers);
    console.log('Query Params:', req.query);
    console.log('Body:', req.body);
    console.log('Timestamp:', new Date().toISOString());
    console.log('===================================');

    return res.status(200).json({
      success: true,
      message: 'Bootstrap received successfully',
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
    console.error('Bootstrap error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error in bootstrap handler'
    });
  }
});

export default router;
