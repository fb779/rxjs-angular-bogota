import {
  of,
  fromEvent,
  interval,
  from,
  Observable,
  Subject,
  ReplaySubject,
  BehaviorSubject,
throwError,
timer
} from "rxjs";
import {
  take,
  map,
  mergeMap,
  concatMap,
  switchMap,
  exhaustMap,
  delay,
  groupBy,
  scan,
  mergeAll,
  reduce,
  tap,
catchError,
retry,
retryWhen,
delayWhen
} from "rxjs/operators";

console.clear();

// ejemplo por defecto
/*const source = of('World').pipe(
  map(x => `Hello ${x}!`)
);

source.subscribe(x => console.log(x));*/

/*******************************************************
 * Primera parte observables de primer oreden
 *******************************************************/

/**
 * primer ejemplo de observable
 * genera un steam de data cada x tiempo segun el parametro de entrada del interval
 */
let obs$ = interval(1000);

obs$.pipe(
  take(10),
  map(x => `conteo ${x}`)
); //.subscribe( console.log );

/**
 * Observable froEvent => escucha un evento del document especifico
 * Operador mergeMap => transforma la data recibida en un observable de salida (no importa lo que llega lo emite en el orden de llegada)
 * Operador concatMap => ejecuta el observable secuencialmente (cuando finalize el actual, inicia el siguiente) y emite su valor como un observable.
 * Operador switchMap => ejecuta el observable hasta recibir otro evento, (cancela el observable actual y ejecuta el nuevo observeble) y emite su valor como un observable.
 * Operador exhaustMap => omite todas las ejecuciones hasta terminar el observeble actual y emite su valor como un observable.
 *
 */
let click$ = fromEvent<MouseEvent>(document, "click");

click$.pipe(
  //mergeMap( ev => interval(1000).pipe(take(4)) )
  //concatMap( ev => interval(1000).pipe(take(4)) )
  //switchMap( ev => interval(500).pipe(take(4)) )
  exhaustMap(ev => interval(500).pipe(take(10)))
); //.subscribe(console.log)

/*******************************************************
 * Segunda parte observables de primer oreden
 *******************************************************/

/**
 * puntaje de dos jugadores
 */
let events$ = from([
  { playerId: 1, points: 3 },
  { playerId: 2, points: 1 },
  { playerId: 1, points: 1 },
  { playerId: 2, points: 1 },
  { playerId: 3, points: 0 },
  { playerId: 2, points: 2 },
  { playerId: 1, points: 1 },
  { playerId: 2, points: 2 },
  { playerId: 3, points: 4 },
  { playerId: 2, points: 2 },
  { playerId: 1, points: 1 }
]).pipe(concatMap(e => of(e).pipe(delay(500))));

let sumPoints = (playerSum, player) => {
  return {
    playerId: player.playerId,
    points: player.points + playerSum.points
  };
};

/**
 * operador groupBy => agrupa la data por el parametro definido creando nuevos steams de datos
 * operador map => transforma la data y genera un valor concreto
 * operador scan => acumula la el valor segun la funcion determinada
 * operador mergeAll => escucha y guarda todas las emisiones realizadas y emite su valor
 */

events$.pipe(
  groupBy(p => p.playerId),
  //map(player$ => player$.pipe(reduce(sumPoints))),
  map(player$ =>
    player$.pipe(
      tap(x => console.log("valores originales", x)),
      scan(sumPoints)
    )
  ),
  mergeAll()
); //.subscribe(x => console.log(x));

/******************************************************************************
 * Tercera parte Observables frios y calientes => hot and cold observables
 ******************************************************************************/

let random$ = new Observable(observer => {
  setInterval(() => observer.next(Math.random()), 1000);
}).pipe(take(7));

/**
 * Observables frios => cold observable
 *  son subcripciones independientes al observable y su data es direfente
 */
let sub_random1 = random$; //.subscribe(x => console.log("Subscriber 1: " + x));
let sub_random2 = random$; //.subscribe(x => console.log("Subscriber 2: " + x));

/**
 * Observables calientes => hot observable
 *  se realiza la configuracion manual
 *  son subcripciones que se maneja con un "mediador" el cual se encarga
 *  de emitir el mismo valor a todas las subscripciones
 */

let bridgeObserver = {
  next(x) {
    this.observers.forEach(obs => obs.next(x));
  },
  observers: [],
  addObserver(obs) {
    this.observers.push(obs);
  }
};

let obs1 = {
  next(x) {
    console.log(`Subscriber 1: ${x}`);
  }
};

let obs2 = {
  next(x) {
    console.log(`Subscriber 2: ${x}`);
  }
};

random$; //.subscribe(bridgeObserver);
bridgeObserver.addObserver(obs1);
bridgeObserver.addObserver(obs2);

/**
 * Observables calientes => hot observable
 *  Configuracion con el subject =>
 *    emite los valores despues de la subscripcion, y emite los valores desde la subscripcion
 */

let subject$ = new Subject();
let subscription = random$.subscribe(subject$);

let subs1 = subject$; //.subscribe(x => console.log("Subscriber 1: " + x));
let subs2 = subject$; //.subscribe(x => console.log("Subscriber 2: " + x));

/**
 * Observables calientes => hot observable
 *   utilizando subject ReplaySubject =>
 *    este segun la configuracion emite la cantidad de valores configurados
 *    para las futuras subscripciones
 *
 */

let subjectRP = new ReplaySubject(2);

subjectRP.next("a");
subjectRP.next("b");
subjectRP.next("c");

subjectRP; //.subscribe(x => console.log(`Subscriber 1: ${x} `));
subjectRP; //.subscribe(x => console.log(`Subscriber 2: ${x} `));

/*setTimeout(
  () => subjectRP.subscribe(x => console.log(`Subscriber 3: ${x}`)),
  2000
);*/

subjectRP.next(2);
subjectRP.next(1);
subjectRP.next(2);
subjectRP.complete;

/**
 * Observables calientes => hot observable
 *   utilizando subject BehaviorSubject =>
 *    require inicialización de valor a emitir
 *    emite el ultimo valor emitido.
 */

let subjectBS = new BehaviorSubject('');

subjectBS.next("a");
subjectBS.next("c");
subjectBS.next("b");

subjectBS; //.subscribe(x => console.log(`Subscriber 1: ${x} `));
subjectBS; //.subscribe(x => console.log(`Subscriber 2: ${x} `));


/*******************************************************
 * Tercera parte manejo de errores
 *******************************************************/

/**
 * Se define un stream con la funcion de error de RxJs, 
 * por lo cual simpre que se subcriba se genera un error
 * 
 * definicion del error
 */

const stream = throwError("This is an error");

/**
 * Ejemplo 1, manejo de errores con RxJs
 *  Se realiza la subscripcion del stream error 
 *  y se maneja el error con el operador catchError en el pipe
 */
const example1 = stream.pipe(
  catchError(err => of("I caught " + err))
)//.subscribe(x => console.log(x));

/**
 * Ejemplo 2, manejo de errores con RxJs
 *  Se realiza la subscripcion a un stream interval con emision de 1 segundo
 *  se evalua si el dato es mayor a un valor random para generar un error
 */
const example2 = interval(500).pipe(
  mergeMap((value, index) => {
    let random = Math.floor(Math.random() * 10);
    console.log(`indice: ${ index } - valor del stream: ${ value } - valor random: ${ random }`);
    if (value > random) {
      console.log(value);
      return throwError("ERROR: BOOM!");
    }
    return of(value);
  }),
  retry(2),
  /*retryWhen(error =>
    error.pipe(
      tap(value =>
        console.log(`${value} occured! I will retry in 2 seconds...`)
      ),
      delayWhen(value => timer(2000)),
    )
  )*/
);

/**
 *  Se realiza la subscripcion al stream del ejemplo 
 *  y se canaliza el error en la subscripcion con la funciona de error del Observable
 */
example2.subscribe(
  x => console.log(x), 
  error => console.log(error)
);