import { of, fromEvent, interval, from } from 'rxjs'; 
import { take, map, mergeMap, concatMap, switchMap, exhaustMap, delay, groupBy, scan, mergeAll, reduce  } from 'rxjs/operators';

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
  map( x => `conteo ${x}` )
)//.subscribe( console.log );


/**
 * Observable froEvent => escucha un evento del document especifico
 * Operador mergeMap => transforma la data recibida en un observable de salida
 * Operador concatMap => ejecuta el observable secuencialmente (cuando finalize el actual, inicia el siguiente) y emite su valor como un observable.
 * Operador switchMap => ejecuta el observable hasta recibir otro evento, (cancela el observable actual y ejecuta el nuevo observeble) y emite su valor como un observable.
 * Operador exhaustMap => omite todas las ejecuciones hasta terminar el observeble actual y emite su valor como un observable.
 * 
 */
let click$ = fromEvent<MouseEvent>( document, 'click');

click$.pipe(
  //map((x:MouseEvent) => x)
).subscribe(x => console.log('otro observalbe', x))

click$.pipe(
  // mergeMap( ev => interval(1000).pipe(take(4)) )
  // concatMap( ev => interval(1000).pipe(take(4)) )
  //switchMap( ev => interval(500).pipe(take(4)) )
  exhaustMap( ev => interval(500).pipe(take(10)) )
)//.subscribe(console.log)


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
  { playerId: 1, points: 1 },
])//.pipe(concatMap(e => of(e).pipe(delay(500))));

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
 */

events$
  .pipe(
    groupBy(p => p.playerId),
    //map(player$ => player$.pipe(reduce(sumPoints))),
    map(player$ => player$.pipe(scan(sumPoints))),
    mergeAll()
  )
  .subscribe(x => console.log(x));