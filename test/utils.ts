export const emails = ['one@example.com', 'two@example2.com']

export const DERIVATIVE_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

export const EMAIL_LEDGER_ABI = [
  {
    inputs: [
      {
        internalType: 'string',
        name: 'domain',
        type: 'string',
      },
    ],
    name: 'getDerivativeContract',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]
