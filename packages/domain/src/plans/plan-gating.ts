export const planGatingBaseline = {
  consumer: {
    미리확인: {
      precisionAllowed: false
    },
    정밀확인: {
      precisionAllowed: true
    },
    전문가연결: {
      precisionAllowed: true
    }
  },
  investigator: {
    Starter: {
      precisionAllowed: false
    },
    Pro: {
      precisionAllowed: true
    },
    Studio: {
      precisionAllowed: true
    }
  }
} as const;
