import { log } from "gamma";

function Gcf(X, A) {
    let A0 = 0, B0 = 1, A1 = 1, B1 = X, AOLD = 0, N = 0;
    while (Math.abs((A1 - AOLD) / A1) > 1e-5) {
        AOLD = A1;
        N++;
        A0 = A1 + (N - A) * A0;
        B0 = B1 + (N - A) * B0;
        A1 = X * A0 + N * A1;
        B1 = X * B0 + N * B1;
        A0 /= B1;
        B0 /= B1;
        A1 /= B1;
        B1 = 1;
    }
    const Prob = Math.exp(A * Math.log(X) - X - log(A)) * A1;
    return 1 - Prob;
}

function Gser(X, A) {
    let T9 = 1 / A, G = T9, I = 1;
    while (T9 > 1e-5 * G) {
        T9 = T9 * X / (A + I);
        G += T9;
        I += 1;
    }
    G *= Math.exp(A * Math.log(X) - X - log(A));
    return G;
}

function Gammacdf(e, r) {
    return e <= 0 ? 0 : e < r + 1 ? Gser(e, r) : Gcf(e, r);
}

export function chiSquared(e, r) {
    if (r <= 0) throw new Error("Degrees of freedom must be positive");
    return Gammacdf(e / 2, r / 2);
}

// Export the function as both the default and a named export
export default chiSquared;

// Add the cdf property to the function
chiSquared.cdf = chiSquared;